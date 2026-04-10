import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, InvoiceItem, Client } from '../src/store/useStore';
import { useAuth } from '../src/context/AuthContext';
import { invoicesApi, clientsApi } from '../src/api/client';
import { CURRENCIES } from '../src/theme/colors';

export default function AddInvoice() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const { clients, setClients, addInvoice } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const currencySymbol = CURRENCIES[currency]?.symbol || '\u20ac';

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientPicker, setShowClientPicker] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const res = await clientsApi.getAll();
      setClients(res.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const newItems = [...items];
    if (field === 'description') {
      newItems[index].description = value;
    } else {
      const numValue = parseFloat(value) || 0;
      (newItems[index] as any)[field] = numValue;
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, total: 0 }]);
  const removeItem = (index: number) => { if (items.length > 1) setItems(items.filter((_, i) => i !== index)); };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = (subtotal * parseFloat(taxRate || '0')) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!selectedClient) {
      Alert.alert(t('error'), t('selectClient'));
      return;
    }
    if (items.every((item) => !item.description.trim() || item.total === 0)) {
      Alert.alert(t('error'), t('failedToCreate'));
      return;
    }
    setLoading(true);
    try {
      const validItems = items.filter((item) => item.description.trim() && item.total > 0);
      const response = await invoicesApi.create({
        client_name: selectedClient.name,
        client_email: selectedClient.email || '',
        client_address: selectedClient.address || '',
        items: validItems,
        subtotal,
        tax_rate: parseFloat(taxRate || '0'),
        tax_amount: taxAmount,
        total,
        status: 'draft',
        due_date: new Date(dueDate).toISOString(),
        notes,
      });
      addInvoice(response.data);
      router.back();
    } catch (error) {
      Alert.alert(t('error'), t('failedToCreate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('createInvoice')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Client Selection */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('client')}</Text>
          {loadingClients ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
          ) : (
            <TouchableOpacity
              style={[styles.clientSelector, { backgroundColor: theme.card }]}
              onPress={() => setShowClientPicker(true)}
            >
              {selectedClient ? (
                <View style={styles.selectedClient}>
                  <LinearGradient colors={theme.gradients.accent} style={styles.clientAvatar}>
                    <Text style={styles.clientAvatarText}>{selectedClient.name.charAt(0).toUpperCase()}</Text>
                  </LinearGradient>
                  <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, { color: theme.text }]}>{selectedClient.name}</Text>
                    {selectedClient.email ? (
                      <Text style={[styles.clientDetail, { color: theme.textSecondary }]}>{selectedClient.email}</Text>
                    ) : null}
                    {selectedClient.company ? (
                      <Text style={[styles.clientDetail, { color: theme.textMuted }]}>{selectedClient.company}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => setSelectedClient(null)}>
                    <Ionicons name="close-circle" size={24} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.clientPlaceholder}>
                  <Ionicons name="person-add-outline" size={24} color={theme.textMuted} />
                  <Text style={[styles.clientPlaceholderText, { color: theme.textMuted }]}>{t('selectClient')}</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.textMuted} style={{ marginLeft: 'auto' }} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Items Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('items')}</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <Ionicons name="add" size={18} color={theme.primary} />
              <Text style={[styles.addItemText, { color: theme.primary }]}>{t('addItem')}</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={index} style={[styles.itemCard, { backgroundColor: theme.card }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemTitle, { color: theme.textSecondary }]}>{t('item')} {index + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(index)}>
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                placeholder={t('descriptionPlaceholder')}
                placeholderTextColor={theme.textMuted}
                value={item.description}
                onChangeText={(v) => updateItem(index, 'description', v)}
              />
              <View style={styles.itemRow}>
                <View style={styles.itemField}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('qty')}</Text>
                  <TextInput
                    style={[styles.smallInput, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                    placeholder="1"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={item.quantity.toString()}
                    onChangeText={(v) => updateItem(index, 'quantity', v)}
                  />
                </View>
                <View style={styles.itemField}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('price')}</Text>
                  <TextInput
                    style={[styles.smallInput, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="decimal-pad"
                    value={item.unit_price > 0 ? item.unit_price.toString() : ''}
                    onChangeText={(v) => updateItem(index, 'unit_price', v)}
                  />
                </View>
                <View style={styles.itemField}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('total')}</Text>
                  <Text style={[styles.itemTotal, { backgroundColor: theme.backgroundLight, color: theme.success }]}>
                    {currencySymbol}{item.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Additional Details */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('additionalDetails')}</Text>
          <View style={styles.inputGroup}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('taxRate')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                  placeholder="0"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="decimal-pad"
                  value={taxRate}
                  onChangeText={setTaxRate}
                />
              </View>
              <View style={styles.halfField}>
                <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{t('dueDate')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                  value={dueDate}
                  onChangeText={setDueDate}
                />
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.multilineInput, { backgroundColor: theme.card, color: theme.text }]}
              placeholder={t('notesPlaceholder')}
              placeholderTextColor={theme.textMuted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t('subtotal')}</Text>
              <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>{currencySymbol}{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{t('tax')} ({taxRate}%)</Text>
              <Text style={[styles.summaryValue, { color: theme.textSecondary }]}>{currencySymbol}{taxAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>{t('total')}</Text>
              <Text style={[styles.totalValue, { color: theme.success }]}>{currencySymbol}{total.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.submitContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || !selectedClient || total === 0}>
            <LinearGradient
              colors={(!selectedClient || total === 0) ? ['#475569', '#334155'] : theme.gradients.primary}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="document-text" size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>{t('createInvoice')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Client Picker Modal */}
        <Modal
          visible={showClientPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowClientPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('selectClient')}</Text>
                <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Add New Client Button */}
              <TouchableOpacity
                style={[styles.addNewClientRow, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setShowClientPicker(false);
                  router.push('/add-client');
                }}
              >
                <LinearGradient colors={theme.gradients.accent} style={styles.addNewClientIcon}>
                  <Ionicons name="add" size={22} color="#fff" />
                </LinearGradient>
                <Text style={[styles.addNewClientText, { color: theme.primary }]}>{t('addClient')}</Text>
              </TouchableOpacity>

              {clients.length === 0 ? (
                <View style={styles.emptyClients}>
                  <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                  <Text style={[styles.emptyClientsText, { color: theme.textMuted }]}>{t('noClientsYet')}</Text>
                </View>
              ) : (
                <FlatList
                  data={clients}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.clientOption, { borderBottomColor: theme.border }]}
                      onPress={() => {
                        setSelectedClient(item);
                        setShowClientPicker(false);
                      }}
                    >
                      <LinearGradient colors={theme.gradients.primary} style={styles.clientOptionAvatar}>
                        <Text style={styles.clientOptionAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                      <View style={styles.clientOptionInfo}>
                        <Text style={[styles.clientOptionName, { color: theme.text }]}>{item.name}</Text>
                        {item.email ? (
                          <Text style={[styles.clientOptionDetail, { color: theme.textSecondary }]}>{item.email}</Text>
                        ) : null}
                        {item.company ? (
                          <Text style={[styles.clientOptionDetail, { color: theme.textMuted }]}>{item.company}</Text>
                        ) : null}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  closeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 12 },
  addItemButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addItemText: { fontSize: 14, fontWeight: '600' },
  inputGroup: { gap: 12 },
  input: { borderRadius: 12, padding: 16, fontSize: 16 },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  // Client selector
  clientSelector: { borderRadius: 12, padding: 16 },
  selectedClient: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600' },
  clientDetail: { fontSize: 13, marginTop: 2 },
  clientPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientPlaceholderText: { fontSize: 16 },
  // Items
  itemCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  itemRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  itemField: { flex: 1 },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  smallInput: { borderRadius: 8, padding: 12, fontSize: 14 },
  itemTotal: { borderRadius: 8, padding: 12, fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  // Summary
  summaryCard: { borderRadius: 12, padding: 20, marginTop: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginBottom: 0 },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  bottomSpacer: { height: 100 },
  submitContainer: { padding: 20, borderTopWidth: 1 },
  submitButton: { flexDirection: 'row', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  addNewClientRow: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    borderBottomWidth: 1,
  },
  addNewClientIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  addNewClientText: { fontSize: 16, fontWeight: '600' },
  emptyClients: { alignItems: 'center', paddingVertical: 40 },
  emptyClientsText: { fontSize: 14, marginTop: 12, marginBottom: 20 },
  clientOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  clientOptionAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientOptionAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clientOptionInfo: { flex: 1 },
  clientOptionName: { fontSize: 16, fontWeight: '600' },
  clientOptionDetail: { fontSize: 13, marginTop: 2 },
});
