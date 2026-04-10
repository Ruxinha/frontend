import React, { useEffect, useState, useCallback } from 'react';
import { webAlert } from '../src/utils/alert';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore, Client, Transaction } from '../src/store/useStore';
import { useAuth } from '../src/context/AuthContext';
import { clientsApi } from '../src/api/client';
import { CURRENCIES } from '../src/theme/colors';
import { formatDate } from '../src/utils/formatters';

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme, t, currency } = useAuth();
  const { updateClient, removeClient } = useStore();
  const currencySymbol = CURRENCIES[currency]?.symbol || '\u20ac';
  const fmtCurrency = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;

  const [client, setClient] = useState<Client | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', type: 'individual', nif: '', email: '', phone: '', company: '', address: '', notes: '' });

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [clientRes, transRes] = await Promise.all([clientsApi.getById(id), clientsApi.getTransactions(id)]);
      setClient(clientRes.data);
      setTransactions(transRes.data);
      setEditForm({ name: clientRes.data.name, type: clientRes.data.type || 'individual', nif: clientRes.data.nif || '', email: clientRes.data.email || '', phone: clientRes.data.phone || '', company: clientRes.data.company || '', address: clientRes.data.address || '', notes: clientRes.data.notes || '' });
    } catch (error) { webAlert(t('error'), t('failedToCreate')); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const handleSave = async () => {
    if (!id || !editForm.name.trim()) { webAlert(t('error'), t('enterAmount')); return; }
    try {
      const response = await clientsApi.update(id, editForm);
      setClient(response.data); updateClient(id, response.data); setEditing(false);
    } catch (error) { webAlert(t('error'), t('failedToCreate')); }
  };

  const handleDelete = () => {
    clientsApi.delete(id as string).then(() => { removeClient(id as string); router.back(); }).catch(() => {});
  };

  if (loading) {
    return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View></SafeAreaView>;
  }
  if (!client) {
    return <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}><View style={styles.loadingContainer}><Text style={{ color: theme.danger }}>{t('clientNotFound')}</Text></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('clientDetails')}</Text>
        <View style={styles.headerActions}>
          {editing ? (
            <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.card }]} onPress={handleSave}>
              <Ionicons name="checkmark" size={24} color={theme.success} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.card }]} onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={20} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
        <View style={[styles.clientCard, { backgroundColor: theme.card }]}>
          <LinearGradient colors={theme.gradients.primary} style={styles.avatar}>
            <Text style={styles.avatarText}>{client.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          {editing ? (
            <TextInput style={[styles.editNameInput, { backgroundColor: theme.backgroundLight, color: theme.text }]} value={editForm.name} onChangeText={(t2) => setEditForm({ ...editForm, name: t2 })} placeholder={t('name')} placeholderTextColor={theme.textMuted} />
          ) : <Text style={[styles.clientName, { color: theme.text }]}>{client.name}</Text>}
          {!editing && (
            <View style={[styles.badgeContainer, { backgroundColor: client.type === 'company' ? theme.info + '20' : theme.primary + '20' }]}>
              <Text style={[styles.badgeText, { color: client.type === 'company' ? theme.info : theme.primary }]}>
                {client.type === 'company' ? t('companyType') : t('individual')}
              </Text>
            </View>
          )}
          {editing ? (
            <View style={styles.editTypeSelector}>
              <TouchableOpacity style={[styles.typeOptionDetail, editForm.type === 'individual' && {backgroundColor: theme.primary}]} onPress={() => setEditForm({...editForm, type: 'individual'})}>
                <Text style={{color: editForm.type === 'individual' ? '#fff' : theme.text}}>{t('individual')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeOptionDetail, editForm.type === 'company' && {backgroundColor: theme.primary}]} onPress={() => setEditForm({...editForm, type: 'company'})}>
                <Text style={{color: editForm.type === 'company' ? '#fff' : theme.text}}>{t('companyType')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {editing && editForm.type === 'company' ? (
            <TextInput style={[styles.editCompanyInput, { backgroundColor: theme.backgroundLight, color: theme.textSecondary }]} value={editForm.company} onChangeText={(t2) => setEditForm({ ...editForm, company: t2 })} placeholder={t('companyPlaceholder')} placeholderTextColor={theme.textMuted} />
          ) : client.company && client.type === 'company' ? <Text style={[styles.clientCompany, { color: theme.textSecondary }]}>{client.company}</Text> : null}
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statItem, { backgroundColor: theme.card }]}>
            <Ionicons name="cash-outline" size={24} color={theme.success} />
            <Text style={[styles.statValue, { color: theme.text }]}>{fmtCurrency(client.total_revenue)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('totalRevenue')}</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: theme.card }]}>
            <Ionicons name="receipt-outline" size={24} color={theme.primary} />
            <Text style={[styles.statValue, { color: theme.text }]}>{client.transaction_count}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('transactionCount')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('contactInfo')}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="card-outline" size={20} color={theme.textMuted} />
            {editing ? <TextInput style={[styles.editInput, { backgroundColor: theme.backgroundLight, color: theme.text }]} value={editForm.nif} onChangeText={(t2) => setEditForm({...editForm, nif: t2})} placeholder={t('nifPlaceholder')} placeholderTextColor={theme.textMuted} keyboardType="numeric" />
            : <Text style={[styles.infoText, { color: theme.textSecondary }]}>{client.nif || t('nifPlaceholder')}</Text>}
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
            {editing ? <TextInput style={[styles.editInput, { backgroundColor: theme.backgroundLight, color: theme.text }]} value={editForm.email} onChangeText={(t2) => setEditForm({...editForm, email: t2})} placeholder={t('emailPlaceholder')} placeholderTextColor={theme.textMuted} keyboardType="email-address" />
            : <Text style={[styles.infoText, { color: theme.textSecondary }]}>{client.email || t('noEmail')}</Text>}
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="call-outline" size={20} color={theme.textMuted} />
            {editing ? <TextInput style={[styles.editInput, { backgroundColor: theme.backgroundLight, color: theme.text }]} value={editForm.phone} onChangeText={(t2) => setEditForm({...editForm, phone: t2})} placeholder={t('phonePlaceholder')} placeholderTextColor={theme.textMuted} keyboardType="phone-pad" />
            : <Text style={[styles.infoText, { color: theme.textSecondary }]}>{client.phone || t('noPhone')}</Text>}
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
            <Ionicons name="location-outline" size={20} color={theme.textMuted} />
            {editing ? <TextInput style={[styles.editInput, styles.multilineInput, { backgroundColor: theme.backgroundLight, color: theme.text }]} value={editForm.address} onChangeText={(t2) => setEditForm({...editForm, address: t2})} placeholder={t('addressPlaceholder')} placeholderTextColor={theme.textMuted} multiline />
            : <Text style={[styles.infoText, { color: theme.textSecondary }]}>{client.address || t('noAddress')}</Text>}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('notes')}</Text>
        <View style={[styles.notesCard, { backgroundColor: theme.card }]}>
          {editing ? <TextInput style={[styles.notesInput, { backgroundColor: theme.backgroundLight, color: theme.text }]} value={editForm.notes} onChangeText={(t2) => setEditForm({...editForm, notes: t2})} placeholder={t('addNotesAboutClient')} placeholderTextColor={theme.textMuted} multiline />
          : <Text style={[styles.notesText, { color: theme.textSecondary }]}>{client.notes || t('noNotes')}</Text>}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('recentTransactions')}</Text>
        {transactions.length === 0 ? (
          <View style={[styles.emptyTransactions, { backgroundColor: theme.card }]}>
            <Ionicons name="receipt-outline" size={40} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('noTransactionsYet')}</Text>
          </View>
        ) : (
          transactions.slice(0, 5).map((tr) => (
            <View key={tr.id} style={[styles.transactionItem, { backgroundColor: theme.card }]}>
              <View style={styles.transactionLeft}>
                <LinearGradient colors={tr.type === 'income' ? theme.gradients.success : theme.gradients.danger} style={styles.transactionIcon}>
                  <Ionicons name={tr.type === 'income' ? 'arrow-down' : 'arrow-up'} size={16} color="#fff" />
                </LinearGradient>
                <View><Text style={[styles.transactionCategory, { color: theme.text }]}>{tr.category_name}</Text><Text style={[styles.transactionDate, { color: theme.textMuted }]}>{formatDate(tr.date)}</Text></View>
              </View>
              <Text style={[styles.transactionAmount, { color: tr.type === 'income' ? theme.success : theme.danger }]}>
                {tr.type === 'income' ? '+' : '-'}{fmtCurrency(tr.amount)}
              </Text>
            </View>
          ))
        )}

        <TouchableOpacity style={[styles.deleteBtn, { borderColor: theme.danger }]} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
          <Text style={[styles.deleteBtnText, { color: theme.danger }]}>{t('deleteClient')}</Text>
        </TouchableOpacity>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerActions: { width: 40 },
  editButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 20 },
  clientCard: { alignItems: 'center', paddingVertical: 24, marginTop: 16, borderRadius: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  clientName: { fontSize: 24, fontWeight: 'bold' },
  clientCompany: { fontSize: 14, marginTop: 4 },
  badgeContainer: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  editTypeSelector: { flexDirection: 'row', gap: 8, marginTop: 12, marginHorizontal: 20 },
  typeOptionDetail: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  editNameInput: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginHorizontal: 20 },
  editCompanyInput: { fontSize: 14, textAlign: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginTop: 8, marginHorizontal: 20 },
  statsContainer: { flexDirection: 'row', gap: 12, marginTop: 16 },
  statItem: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 24 },
  infoCard: { borderRadius: 12, padding: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  infoText: { fontSize: 14, marginLeft: 12, flex: 1 },
  editInput: { fontSize: 14, marginLeft: 12, flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  multilineInput: { minHeight: 40 },
  notesCard: { borderRadius: 12, padding: 16 },
  notesText: { fontSize: 14, lineHeight: 22 },
  notesInput: { fontSize: 14, padding: 12, borderRadius: 8, minHeight: 80 },
  emptyTransactions: { borderRadius: 12, padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: 12 },
  transactionItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 16, marginBottom: 8 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  transactionCategory: { fontSize: 14, fontWeight: '600' },
  transactionDate: { fontSize: 12, marginTop: 2 },
  transactionAmount: { fontSize: 14, fontWeight: 'bold' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, marginTop: 24, borderWidth: 1, borderRadius: 12, gap: 8 },
  deleteBtnText: { fontSize: 16, fontWeight: '600' },
  bottomSpacer: { height: 40 },
});
