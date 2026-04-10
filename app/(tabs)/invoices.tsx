import React, { useEffect, useState, useCallback } from 'react';
import { webAlert } from '../../src/utils/alert';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, Modal, ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useStore, Invoice, InvoiceItem } from '../../src/store/useStore';
import { useAuth } from '../../src/context/AuthContext';
import { invoicesApi, transactionsApi } from '../../src/api/client';
import { CURRENCIES } from '../../src/theme/colors';
import { formatDate, getStatusColor } from '../../src/utils/formatters';

export default function InvoicesScreen() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const { invoices, setInvoices, removeInvoice, updateInvoice } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statusModalInvoice, setStatusModalInvoice] = useState<Invoice | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit state
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editTaxRate, setEditTaxRate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  const currencySymbol = CURRENCIES[currency]?.symbol || '\u20ac';
  const fmt = (n: number) => `${currencySymbol}${n.toFixed(2)}`;

  const loadData = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await invoicesApi.getAll(params);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  // Open invoice in PREVIEW mode
  const openInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsEditing(false);
    setShowCalendar(false);
  };

  // Switch to EDIT mode
  const switchToEdit = () => {
    if (!selectedInvoice) return;
    setEditInvoiceNumber(selectedInvoice.invoice_number || '');
    setEditNotes(selectedInvoice.notes || '');
    setEditDueDate(selectedInvoice.due_date?.split('T')[0] || '');
    setEditItems(selectedInvoice.items.map((item) => ({ ...item })));
    setEditTaxRate(String(selectedInvoice.tax_rate || 0));
    setShowCalendar(false);
    setIsEditing(true);
  };

  // Items management
  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...editItems];
    if (field === 'description') {
      newItems[index].description = value;
    } else {
      const numVal = parseFloat(value) || 0;
      (newItems[index] as any)[field] = numVal;
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setEditItems(newItems);
  };
  const addEditItem = () => setEditItems([...editItems, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeEditItem = (i: number) => { if (editItems.length > 1) setEditItems(editItems.filter((_, idx) => idx !== i)); };

  const editSubtotal = editItems.reduce((s, it) => s + (it.quantity * it.unit_price), 0);
  const editTaxAmount = (editSubtotal * parseFloat(editTaxRate || '0')) / 100;
  const editTotal = editSubtotal + editTaxAmount;

  // Save edits
  const handleSave = async () => {
    if (!selectedInvoice) return;
    setSaving(true);
    try {
      const validItems = editItems.filter((it) => it.description.trim()).map((it) => ({ ...it, total: it.quantity * it.unit_price }));
      const updates: any = {
        invoice_number: editInvoiceNumber, notes: editNotes,
        due_date: new Date(editDueDate).toISOString(), items: validItems,
        subtotal: editSubtotal, tax_rate: parseFloat(editTaxRate || '0'),
        tax_amount: editTaxAmount, total: editTotal,
      };
      await invoicesApi.update(selectedInvoice.id, updates);
      updateInvoice(selectedInvoice.id, updates);
      const updated = { ...selectedInvoice, ...updates };
      setSelectedInvoice(updated);
      setIsEditing(false);
      webAlert(t('success'), t('settingsUpdated'));
    } catch (error) {
      webAlert(t('error'), t('failedToCreate'));
    } finally { setSaving(false); }
  };

  // Status change
  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    if (newStatus === 'paid' && invoice.status !== 'paid') {
      webAlert(t('registerAsIncome'), `${t('registerAsIncomeQuestion')}\n\n${fmt(invoice.total)}`, [
        { text: t('cancel'), style: 'cancel', onPress: () => doStatusChange(invoice, newStatus) },
        { text: t('registerAsIncome'), onPress: async () => {
          await doStatusChange(invoice, newStatus);
          try {
            await transactionsApi.create({
              amount: invoice.total, type: 'income',
              description: `${t('invoicePayment')} - ${invoice.invoice_number} (${invoice.client_name})`,
              date: new Date().toISOString(),
            });
            webAlert(t('success'), t('incomeRegistered'));
          } catch (e) { console.error('Income registration error:', e); }
        }},
      ]);
    } else { await doStatusChange(invoice, newStatus); }
  };

  const doStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      await invoicesApi.update(invoice.id, { status: newStatus });
      updateInvoice(invoice.id, { status: newStatus as any });
      if (selectedInvoice?.id === invoice.id) setSelectedInvoice({ ...invoice, status: newStatus as any });
      loadData();
    } catch (e) { webAlert(t('error'), t('failedToCreate')); }
  };

  const showStatusOptions = (invoice: Invoice) => {
    // Instead of webAlert, we use our custom Status Picker Modal!
    setStatusModalInvoice(invoice);
  };

  const handleDelete = (invoice: Invoice) => {
    invoicesApi.delete(invoice.id).then(() => { removeInvoice(invoice.id); setSelectedInvoice(null); }).catch(() => {});
  };

  // PDF Export

  const handleDirectPayment = async (invoice: Invoice) => {
    try {
      await invoicesApi.update(invoice.id, { status: 'paid' });
      const updatedInv = { ...invoice, status: 'paid' as any };
      updateInvoice(invoice.id, updatedInv);
      setSelectedInvoice(updatedInv);
      loadData();
      
      // Auto register to sales (income)
      await transactionsApi.create({
        amount: invoice.total,
        type: 'income',
        category_name: 'Vendas',
        description: `${t('invoicePayment')} - ${invoice.invoice_number} (${invoice.client_name})`,
        date: new Date().toISOString(),
      });
      webAlert(t('success'), "Fatura paga e registada como Venda com sucesso!");
    } catch(e) {
      console.error(e);
    }
  };

  const exportPDF = async (invoice: Invoice) => {
    
    // ==========================================
    // ÁREA DE DESIGN ACESSÍVEL PARA O UTILIZADOR
    // ==========================================
    // Aqui podes alterar a estética de todo o PDF gerado. 
    // Muda cores (ex: #6C63FF), tamanhos(ex: 32px), bordas, margens.
    const customCSS = `
      body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #1a1a2e; }
      .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
      .invoice-title { font-size: 32px; font-weight: bold; color: #6C63FF; } /* Cor do título FATURA */
      .invoice-number { font-size: 14px; color: #666; margin-top: 4px; }
      .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: white; background: ${getStatusColor(invoice.status)}; }
      .client-box { background: #f8f8fc; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
      .client-name { font-size: 18px; font-weight: 600; }
      .client-detail { font-size: 14px; color: #666; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #6C63FF; color: white; padding: 12px 16px; text-align: left; font-size: 13px; } /* Cabeçalho Tabela */
      th:last-child, td:last-child { text-align: right; }
      td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
      .summary { margin-top: 20px; text-align: right; }
      .summary-row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; font-size: 14px; color: #666; }
      .total-row { font-size: 20px; font-weight: bold; color: #1a1a2e; border-top: 2px solid #6C63FF; padding-top: 12px; margin-top: 8px; }
      .notes { background: #f8f8fc; border-radius: 12px; padding: 16px; margin-top: 30px; font-size: 13px; color: #666; }
      .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
    `;

    // Isto injeta o design (CSS) e o conteúdo da Fatura (Javascript variables) diretamente!
    const html = `
    <html><head><meta charset="utf-8"><style>${customCSS}</style></head><body>
      .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
      .invoice-title { font-size: 32px; font-weight: bold; color: #6C63FF; }
      .invoice-number { font-size: 14px; color: #666; margin-top: 4px; }
      .status { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: white; background: ${getStatusColor(invoice.status)}; }
      .client-box { background: #f8f8fc; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
      .client-name { font-size: 18px; font-weight: 600; }
      .client-detail { font-size: 14px; color: #666; margin-top: 4px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #6C63FF; color: white; padding: 12px 16px; text-align: left; font-size: 13px; }
      th:last-child, td:last-child { text-align: right; }
      td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
      .summary { margin-top: 20px; text-align: right; }
      .summary-row { display: flex; justify-content: flex-end; gap: 40px; padding: 8px 0; font-size: 14px; color: #666; }
      .total-row { font-size: 20px; font-weight: bold; color: #1a1a2e; border-top: 2px solid #6C63FF; padding-top: 12px; margin-top: 8px; }
      .notes { background: #f8f8fc; border-radius: 12px; padding: 16px; margin-top: 30px; font-size: 13px; color: #666; }
      .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #999; }
    </style></head><body>
      <div class="header">
        <div><div class="invoice-title">FATURA</div><div class="invoice-number">${invoice.invoice_number}</div></div>
        <div><span class="status">${t(invoice.status).toUpperCase()}</span></div>
      </div>
      <div class="client-box">
        <div class="client-name">${invoice.client_name}</div>
        ${invoice.client_email ? `<div class="client-detail">${invoice.client_email}</div>` : ''}
        ${invoice.client_address ? `<div class="client-detail">${invoice.client_address}</div>` : ''}
      </div>
      <div style="font-size:13px;color:#666;">Data de vencimento: ${formatDate(invoice.due_date)}</div>
      <table>
        <thead><tr><th>Descrição</th><th>Qtd</th><th>Preço</th><th>Total</th></tr></thead>
        <tbody>${invoice.items.map((it: InvoiceItem) => `<tr><td>${it.description}</td><td>${it.quantity}</td><td>${fmt(it.unit_price)}</td><td>${fmt(it.total)}</td></tr>`).join('')}</tbody>
      </table>
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><span>${fmt(invoice.subtotal)}</span></div>
        <div class="summary-row"><span>Imposto (${invoice.tax_rate}%)</span><span>${fmt(invoice.tax_amount)}</span></div>
        <div class="summary-row total-row"><span>Total</span><span>${fmt(invoice.total)}</span></div>
      </div>
      ${invoice.notes ? `<div class="notes"><strong>Notas:</strong> ${invoice.notes}</div>` : ''}
      <div class="footer">BizFinance · Gerado automaticamente</div>
    </body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: invoice.invoice_number });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('PDF error:', error);
      // Fallback: print directly
      try { await Print.printAsync({ html }); } catch (e) { webAlert(t('error'), 'PDF export failed'); }
    }
  };

  const filters = [
    { key: 'all', label: t('all') }, { key: 'draft', label: t('draft') },
    { key: 'sent', label: t('sent') }, { key: 'approved', label: t('approved') },
    { key: 'paid', label: t('paid') }, { key: 'overdue', label: t('overdue') },
  ];

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity style={[styles.invoiceItem, { backgroundColor: theme.card }]} onPress={() => openInvoice(item)} activeOpacity={0.7}>
      <View style={styles.invoiceHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.invoiceNumber, { color: theme.primary }]}>{item.invoice_number}</Text>
          <Text style={[styles.clientName, { color: theme.text }]}>{item.client_name}</Text>
        </View>
        <TouchableOpacity style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]} onPress={() => showStatusOptions(item)}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{t(item.status)}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.detailLabel, { color: theme.textMuted, marginTop: 10 }]}>{t('items')} {item.items.length} · {formatDate(item.due_date)}</Text>
      <View style={[styles.invoiceFooter, { borderTopColor: theme.border }]}>
        <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>{t('total')}</Text>
        <Text style={[styles.totalAmount, { color: theme.text }]}>{fmt(item.total)}</Text>
      </View>
    </TouchableOpacity>
  );

  // PREVIEW VIEW
  const renderPreview = () => {
    if (!selectedInvoice) return null;
    const inv = selectedInvoice;
    return (
      <>
        <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setSelectedInvoice(null)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('invoiceDetails')}</Text>
          <View style={styles.modalHeaderActions}>
            <TouchableOpacity onPress={() => exportPDF(inv)} style={{ marginRight: 16 }}>
              <Ionicons name="download-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={switchToEdit}>
              <Ionicons name="create-outline" size={22} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Invoice card */}
          <View style={[styles.previewCard, { backgroundColor: theme.card }]}>
            <View style={styles.previewCardRow}>
              <View>
                <Text style={[styles.previewInvTitle, { color: theme.primary }]}>FATURA</Text>
                <Text style={[styles.previewInvNum, { color: theme.textSecondary }]}>{inv.invoice_number}</Text>
              </View>
              <TouchableOpacity style={[styles.statusBadge, { backgroundColor: getStatusColor(inv.status) + '20' }]} onPress={() => showStatusOptions(inv)}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(inv.status) }]} />
                <Text style={[styles.statusText, { color: getStatusColor(inv.status) }]}>{t(inv.status)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Client */}
          <View style={[styles.previewSection, { backgroundColor: theme.card }]}>
            <View style={styles.previewSectionHeader}>
              <Ionicons name="person-outline" size={18} color={theme.primary} />
              <Text style={[styles.previewSectionTitle, { color: theme.textSecondary }]}>{t('client')}</Text>
            </View>
            <Text style={[styles.previewClientName, { color: theme.text }]}>{inv.client_name}</Text>
            {inv.client_email ? <Text style={[styles.previewClientDetail, { color: theme.textSecondary }]}>{inv.client_email}</Text> : null}
            {inv.client_address ? <Text style={[styles.previewClientDetail, { color: theme.textMuted }]}>{inv.client_address}</Text> : null}
          </View>

          {/* Due date */}
          <View style={[styles.previewSection, { backgroundColor: theme.card }]}>
            <View style={styles.previewSectionHeader}>
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              <Text style={[styles.previewSectionTitle, { color: theme.textSecondary }]}>{t('dueDate')}</Text>
            </View>
            <Text style={[styles.previewDateText, { color: theme.text }]}>{formatDate(inv.due_date)}</Text>
          </View>

          {/* Items */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('items')}</Text>
          {inv.items.map((item: InvoiceItem, i: number) => (
            <View key={i} style={[styles.previewItem, { backgroundColor: theme.card }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.previewItemDesc, { color: theme.text }]}>{item.description}</Text>
                <Text style={[styles.previewItemQty, { color: theme.textMuted }]}>{item.quantity} x {fmt(item.unit_price)}</Text>
              </View>
              <Text style={[styles.previewItemTotal, { color: theme.text }]}>{fmt(item.total)}</Text>
            </View>
          ))}

          {/* Totals */}
          <View style={[styles.totalsCard, { backgroundColor: theme.card }]}>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: theme.textSecondary }]}>{t('subtotal')}</Text>
              <Text style={[styles.totalsValue, { color: theme.textSecondary }]}>{fmt(inv.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: theme.textSecondary }]}>{t('tax')} ({inv.tax_rate}%)</Text>
              <Text style={[styles.totalsValue, { color: theme.textSecondary }]}>{fmt(inv.tax_amount)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsFinalRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.totalsFinalLabel, { color: theme.text }]}>{t('total')}</Text>
              <Text style={[styles.totalsFinalValue, { color: theme.success }]}>{fmt(inv.total)}</Text>
            </View>
          </View>

          {/* Notes */}
          {inv.notes ? (
            <View style={[styles.previewSection, { backgroundColor: theme.card }]}>
              <View style={styles.previewSectionHeader}>
                <Ionicons name="document-text-outline" size={18} color={theme.primary} />
                <Text style={[styles.previewSectionTitle, { color: theme.textSecondary }]}>{t('notes')}</Text>
              </View>
              <Text style={[styles.previewNotesText, { color: theme.text }]}>{inv.notes}</Text>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.previewActions}>
            {inv.status === 'approved' && (
              <TouchableOpacity onPress={() => handleDirectPayment(inv)} style={{ flex: 1, marginBottom: 12 }}>
                <LinearGradient colors={theme.gradients.success} style={[styles.primaryActionBtn, { marginBottom: 0 }]}>
                  <Ionicons name="cash-outline" size={20} color="#fff" />
                  <Text style={styles.primaryActionBtnText}>Efetuar Pagamento</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={() => showStatusOptions(inv)} style={{ flex: 1 }}>
              <LinearGradient colors={theme.gradients.primary} style={styles.actionBtn}>
                <Ionicons name="sync-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>{t('changeStatus')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => exportPDF(inv)} style={{ flex: 1 }}>
              <LinearGradient colors={theme.gradients.success} style={styles.actionBtn}>
                <Ionicons name="download-outline" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>PDF</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => handleDelete(inv)} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={theme.danger} />
            <Text style={[styles.deleteBtnText, { color: theme.danger }]}>{t('deleteInvoice')}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  };

  // EDIT VIEW
  const renderEdit = () => {
    if (!selectedInvoice) return null;
    return (
      <>
        <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => setIsEditing(false)}><Ionicons name="arrow-back" size={24} color={theme.text} /></TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.text }]}>{t('editInvoice')}</Text>
          <TouchableOpacity onPress={handleSave}>{saving ? <ActivityIndicator color={theme.primary} size="small" /> : <Ionicons name="checkmark" size={24} color={theme.primary} />}</TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Invoice Number */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>N.º Fatura</Text>
          <View style={[styles.editCard, { backgroundColor: theme.card }]}>
            <TextInput style={[styles.editInput, { backgroundColor: theme.backgroundLight, color: theme.text }]}
              value={editInvoiceNumber} onChangeText={setEditInvoiceNumber} placeholderTextColor={theme.textMuted} />
          </View>

          {/* Due Date */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('dueDate')}</Text>
          <TouchableOpacity style={[styles.editCard, { backgroundColor: theme.card }]} onPress={() => setShowCalendar(!showCalendar)}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.primary} />
              <Text style={[styles.dateText, { color: theme.text }]}>{editDueDate || 'YYYY-MM-DD'}</Text>
              <Ionicons name={showCalendar ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textMuted} />
            </View>
          </TouchableOpacity>
          {showCalendar && (
            <View style={[styles.calendarContainer, { backgroundColor: theme.card }]}>
              <Calendar current={editDueDate || undefined}
                onDayPress={(day: any) => { setEditDueDate(day.dateString); setShowCalendar(false); }}
                markedDates={{ [editDueDate]: { selected: true, selectedColor: theme.primary } }}
                theme={{ backgroundColor: theme.card, calendarBackground: theme.card, textSectionTitleColor: theme.textSecondary,
                  dayTextColor: theme.text, todayTextColor: theme.primary, monthTextColor: theme.text,
                  arrowColor: theme.primary, textDisabledColor: theme.textMuted,
                  selectedDayBackgroundColor: theme.primary, selectedDayTextColor: '#ffffff' }} />
            </View>
          )}

          {/* Items */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('items')}</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={addEditItem}>
              <Ionicons name="add-circle" size={22} color={theme.primary} />
              <Text style={[styles.addItemText, { color: theme.primary }]}>{t('addItem')}</Text>
            </TouchableOpacity>
          </View>
          {editItems.map((item, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: theme.card }]}>
              <View style={styles.itemCardHeader}>
                <Text style={[styles.itemCardTitle, { color: theme.textSecondary }]}>{t('item')} {index + 1}</Text>
                {editItems.length > 1 && <TouchableOpacity onPress={() => removeEditItem(index)}><Ionicons name="trash-outline" size={18} color={theme.danger} /></TouchableOpacity>}
              </View>
              <TextInput style={[styles.editInput, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                placeholder={t('descriptionPlaceholder')} placeholderTextColor={theme.textMuted}
                value={item.description} onChangeText={(v) => updateItem(index, 'description', v)} />
              <View style={styles.itemInputRow}>
                <View style={styles.itemInputField}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('qty')}</Text>
                  <TextInput style={[styles.editInputSmall, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                    keyboardType="numeric" value={String(item.quantity)} onChangeText={(v) => updateItem(index, 'quantity', v)} />
                </View>
                <View style={styles.itemInputField}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('price')}</Text>
                  <TextInput style={[styles.editInputSmall, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                    keyboardType="decimal-pad" value={item.unit_price > 0 ? String(item.unit_price) : ''} placeholder="0.00"
                    placeholderTextColor={theme.textMuted} onChangeText={(v) => updateItem(index, 'unit_price', v)} />
                </View>
                <View style={styles.itemInputField}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('total')}</Text>
                  <View style={[styles.editInputSmall, { backgroundColor: theme.backgroundLight, justifyContent: 'center' }]}>
                    <Text style={[styles.itemTotalText, { color: theme.success }]}>{fmt(item.quantity * item.unit_price)}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {/* Tax */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('taxRate')}</Text>
          <View style={[styles.editCard, { backgroundColor: theme.card }]}>
            <TextInput style={[styles.editInput, { backgroundColor: theme.backgroundLight, color: theme.text }]}
              keyboardType="decimal-pad" value={editTaxRate} onChangeText={setEditTaxRate} placeholder="0" placeholderTextColor={theme.textMuted} />
          </View>

          {/* Notes */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('notes')}</Text>
          <View style={[styles.editCard, { backgroundColor: theme.card }]}>
            <TextInput style={[styles.editInput, styles.editInputMulti, { backgroundColor: theme.backgroundLight, color: theme.text }]}
              placeholder={t('notesPlaceholder')} placeholderTextColor={theme.textMuted} multiline value={editNotes} onChangeText={setEditNotes} />
          </View>

          {/* Summary */}
          <View style={[styles.totalsCard, { backgroundColor: theme.card }]}>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: theme.textSecondary }]}>{t('subtotal')}</Text>
              <Text style={[styles.totalsValue, { color: theme.textSecondary }]}>{fmt(editSubtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={[styles.totalsLabel, { color: theme.textSecondary }]}>{t('tax')} ({editTaxRate}%)</Text>
              <Text style={[styles.totalsValue, { color: theme.textSecondary }]}>{fmt(editTaxAmount)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsFinalRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.totalsFinalLabel, { color: theme.text }]}>{t('total')}</Text>
              <Text style={[styles.totalsFinalValue, { color: theme.success }]}>{fmt(editTotal)}</Text>
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginTop: 20 }}>
            <LinearGradient colors={theme.gradients.primary} style={styles.saveButton}>
              {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.saveButtonText}>{t('saveChanges')}</Text></>}
            </LinearGradient>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </>
    );
  };

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('invoices')}</Text>
        <TouchableOpacity onPress={() => router.push('/add-invoice')}>
          <LinearGradient colors={theme.gradients.primary} style={styles.addButton}><Ionicons name="add" size={24} color="#fff" /></LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.filterScroll}>
        <FlatList horizontal data={filters} keyExtractor={(i) => i.key} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}
          renderItem={({ item: f }) => (
            <TouchableOpacity style={styles.filterButton} onPress={() => setStatusFilter(f.key)}>
              {statusFilter === f.key ? (
                <LinearGradient colors={theme.gradients.primary} style={styles.filterGradient}><Text style={styles.filterTextActive}>{f.label}</Text></LinearGradient>
              ) : (
                <View style={[styles.filterInactive, { backgroundColor: theme.card }]}><Text style={[styles.filterText, { color: theme.textSecondary }]}>{f.label}</Text></View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {invoices.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>{t('noInvoices')}</Text>
          <TouchableOpacity onPress={() => router.push('/add-invoice')}>
            <LinearGradient colors={theme.gradients.primary} style={styles.emptyButton}><Text style={styles.emptyButtonText}>{t('createInvoice')}</Text></LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList data={invoices} keyExtractor={(item) => item.id} renderItem={renderInvoice}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />
      )}

      {/* Custom Status Picker Modal */}
      <Modal visible={!!statusModalInvoice} transparent animationType="fade" onRequestClose={() => setStatusModalInvoice(null)}>
        <TouchableOpacity style={styles.statusModalOverlay} activeOpacity={1} onPress={() => setStatusModalInvoice(null)}>
          <View style={[styles.statusModalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.statusModalTitle, { color: theme.text }]}>{t('changeStatus')}</Text>
            {['draft', 'sent', 'approved', 'paid', 'overdue'].map((s) => (
              <TouchableOpacity key={s} 
                style={[styles.statusModalOption, { borderBottomColor: theme.border }]} 
                onPress={() => {
                  if (statusModalInvoice) handleStatusChange(statusModalInvoice, s);
                  setStatusModalInvoice(null);
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(s) }]} />
                <Text style={[styles.statusModalOptionText, { color: theme.text }]}>{t(s)}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.statusModalCancel} onPress={() => setStatusModalInvoice(null)}>
              <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 16 }}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Invoice Modal: Preview or Edit */}
      <Modal visible={!!selectedInvoice} animationType="slide" transparent onRequestClose={() => { if (isEditing) setIsEditing(false); else setSelectedInvoice(null); }}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalContent, { backgroundColor: theme.background }]}>
            {isEditing ? renderEdit() : renderPreview()}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  filterScroll: { marginBottom: 8 },
  filterContainer: { paddingHorizontal: 20, gap: 8 },
  filterButton: {},
  filterGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterInactive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterTextActive: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterText: { fontSize: 14 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 24 },
  emptyButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  invoiceItem: { borderRadius: 16, padding: 16, marginBottom: 12 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceNumber: { fontSize: 14, fontWeight: '600' },
  clientName: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  detailLabel: { fontSize: 13 },
  invoiceFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  totalLabel: { fontSize: 14 },
  totalAmount: { fontSize: 18, fontWeight: 'bold' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { flex: 1, marginTop: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalHeaderActions: { flexDirection: 'row', alignItems: 'center' },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  // Preview
  previewCard: { borderRadius: 16, padding: 20, marginTop: 16 },
  previewCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  previewInvTitle: { fontSize: 24, fontWeight: 'bold', letterSpacing: 2 },
  previewInvNum: { fontSize: 14, marginTop: 2 },
  previewSection: { borderRadius: 14, padding: 16, marginTop: 12 },
  previewSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  previewSectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  previewClientName: { fontSize: 18, fontWeight: '600' },
  previewClientDetail: { fontSize: 14, marginTop: 2 },
  previewDateText: { fontSize: 16, fontWeight: '500' },
  previewItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 8, backgroundColor: 'transparent' },
  previewItemDesc: { fontSize: 15, fontWeight: '600' },
  previewItemQty: { fontSize: 13, marginTop: 2 },
  previewItemTotal: { fontSize: 15, fontWeight: '600' },
  previewNotesText: { fontSize: 14, lineHeight: 20 },
  previewActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 12 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingVertical: 12 },
  deleteBtnText: { fontSize: 15, fontWeight: '500' },
  // Edit
  sectionTitle: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  editCard: { borderRadius: 14, padding: 14, marginBottom: 8 },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  editInput: { borderRadius: 10, padding: 14, fontSize: 15 },
  editInputSmall: { borderRadius: 10, padding: 12, fontSize: 14 },
  editInputMulti: { minHeight: 80, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { flex: 1, fontSize: 15 },
  calendarContainer: { borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { fontSize: 14, fontWeight: '600' },
  itemCard: { borderRadius: 14, padding: 14, marginBottom: 10 },
  itemCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  itemCardTitle: { fontSize: 13, fontWeight: '600' },
  itemInputRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  itemInputField: { flex: 1 },
  itemTotalText: { fontSize: 14, fontWeight: '600' },
  totalsCard: { borderRadius: 14, padding: 16, marginTop: 16 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalsLabel: { fontSize: 14 },
  totalsValue: { fontSize: 14 },
  totalsFinalRow: { borderTopWidth: 1, paddingTop: 10, marginBottom: 0 },
  totalsFinalLabel: { fontSize: 16, fontWeight: '600' },
  totalsFinalValue: { fontSize: 22, fontWeight: 'bold' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
