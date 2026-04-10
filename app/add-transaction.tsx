import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, Category, Client } from '../src/store/useStore';
import { useAuth } from '../src/context/AuthContext';
import { transactionsApi, categoriesApi, clientsApi } from '../src/api/client';
import { CURRENCIES } from '../src/theme/colors';

export default function AddTransaction() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const { categories, clients, setCategories, setClients, addTransaction } = useStore();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showClientPicker, setShowClientPicker] = useState(false);

  const currencySymbol = CURRENCIES[currency]?.symbol || '\u20ac';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [catRes, clientRes] = await Promise.all([categoriesApi.getAll(), clientsApi.getAll()]);
      setCategories(catRes.data);
      setClients(clientRes.data);
    } catch (error) { console.error('Error loading data:', error); }
    finally { setLoadingData(false); }
  };

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert(t('error'), t('enterAmount')); return; }
    if (!selectedCategory) { Alert.alert(t('error'), t('selectACategory')); return; }

    setLoading(true);
    try {
      const response = await transactionsApi.create({
        amount: parseFloat(amount), type,
        category_id: selectedCategory.id, category_name: selectedCategory.name,
        description, date: new Date(date).toISOString(),
        client_id: selectedClient?.id, client_name: selectedClient?.name,
      });
      addTransaction(response.data);
      router.back();
    } catch (error) { Alert.alert(t('error'), t('failedToCreate')); }
    finally { setLoading(false); }
  };

  const getIconName = (iconName: string) => {
    const iconMap: Record<string, string> = {
      cart: 'cart-outline', briefcase: 'briefcase-outline',
      'trending-up': 'trending-up-outline', cash: 'cash-outline',
      home: 'home-outline', flash: 'flash-outline',
      cube: 'cube-outline', megaphone: 'megaphone-outline',
      people: 'people-outline', airplane: 'airplane-outline',
      receipt: 'receipt-outline', card: 'card-outline',
      gift: 'gift-outline', restaurant: 'restaurant-outline',
      car: 'car-outline', medical: 'medical-outline',
      school: 'school-outline', construct: 'construct-outline',
    };
    if (iconName.includes('-outline')) return iconName;
    return iconMap[iconName] || 'ellipse-outline';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('addTransaction')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: theme.card }, type === 'income' && { backgroundColor: theme.success }]}
              onPress={() => { setType('income'); setSelectedCategory(null); }}
            >
              <Ionicons name="arrow-down" size={20} color={type === 'income' ? '#fff' : theme.success} />
              <Text style={[styles.typeButtonText, { color: theme.textSecondary }, type === 'income' && styles.typeButtonTextActive]}>{t('income')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, { backgroundColor: theme.card }, type === 'expense' && { backgroundColor: theme.danger }]}
              onPress={() => { setType('expense'); setSelectedCategory(null); setSelectedClient(null); }}
            >
              <Ionicons name="arrow-up" size={20} color={type === 'expense' ? '#fff' : theme.danger} />
              <Text style={[styles.typeButtonText, { color: theme.textSecondary }, type === 'expense' && styles.typeButtonTextActive]}>{t('expenses')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.amountContainer}>
            <Text style={[styles.currencySymbol, { color: theme.textMuted }]}>{currencySymbol}</Text>
            <TextInput style={[styles.amountInput, { color: theme.text }]} placeholder="0.00" placeholderTextColor={theme.textMuted} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          </View>

          {type === 'income' && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('client')} ({t('optional')})</Text>
              <TouchableOpacity style={[styles.clientSelector, { backgroundColor: theme.card }]} onPress={() => setShowClientPicker(true)}>
                {selectedClient ? (
                  <View style={styles.selectedClient}>
                    <LinearGradient colors={theme.gradients.primary} style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>{selectedClient.name.charAt(0).toUpperCase()}</Text>
                    </LinearGradient>
                    <View style={styles.clientInfo}>
                      <Text style={[styles.clientName, { color: theme.text }]}>{selectedClient.name}</Text>
                      {selectedClient.company ? <Text style={[styles.clientCompany, { color: theme.textSecondary }]}>{selectedClient.company}</Text> : null}
                    </View>
                    <TouchableOpacity onPress={() => setSelectedClient(null)}>
                      <Ionicons name="close-circle" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.clientPlaceholder}>
                    <Ionicons name="person-add-outline" size={24} color={theme.textMuted} />
                    <Text style={[styles.clientPlaceholderText, { color: theme.textMuted }]}>{t('selectClient')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('category')}</Text>
          {loadingData ? <ActivityIndicator color={theme.primary} /> : (
            <View style={styles.categoriesGrid}>
              {filteredCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[styles.categoryItem, { backgroundColor: theme.card }, selectedCategory?.id === category.id && { backgroundColor: theme.cardLight, borderWidth: 2, borderColor: theme.primary }]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: selectedCategory?.id === category.id ? category.color : category.color + '30' }]}>
                    <Ionicons name={getIconName(category.icon) as any} size={20} color={selectedCategory?.id === category.id ? '#fff' : category.color} />
                  </View>
                  <Text style={[styles.categoryName, { color: theme.textSecondary }, selectedCategory?.id === category.id && { color: theme.text, fontWeight: '600' }]} numberOfLines={1}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('description')} ({t('optional')})</Text>
          <TextInput style={[styles.descriptionInput, { backgroundColor: theme.card, color: theme.text }]} placeholder={t('enterDescription')} placeholderTextColor={theme.textMuted} value={description} onChangeText={setDescription} multiline />

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('date')}</Text>
          <TextInput style={[styles.dateInput, { backgroundColor: theme.card, color: theme.text }]} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textMuted} value={date} onChangeText={setDate} />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={[styles.submitContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || !amount || !selectedCategory}>
            <LinearGradient
              colors={(!amount || !selectedCategory) ? ['#475569', '#334155'] : theme.gradients.primary}
              style={styles.submitButton}
            >
              {loading ? <ActivityIndicator color="#fff" /> : (
                <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.submitButtonText}>{t('addTransaction')}</Text></>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Modal visible={showClientPicker} animationType="slide" transparent={true} onRequestClose={() => setShowClientPicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>{t('selectClient')}</Text>
                <TouchableOpacity onPress={() => setShowClientPicker(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              {clients.length === 0 ? (
                <View style={styles.emptyClients}>
                  <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                  <Text style={[styles.emptyClientsText, { color: theme.textMuted }]}>{t('noClientsYet')}</Text>
                  <TouchableOpacity onPress={() => { setShowClientPicker(false); router.push('/add-client'); }}>
                    <LinearGradient colors={theme.gradients.primary} style={styles.addClientButton}>
                      <Text style={styles.addClientButtonText}>{t('addClient')}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.addNewClientRow, { borderBottomColor: theme.border }]}
                    onPress={() => { setShowClientPicker(false); router.push('/add-client'); }}
                  >
                    <LinearGradient colors={theme.gradients.accent} style={styles.addNewClientIcon}>
                      <Ionicons name="add" size={22} color="#fff" />
                    </LinearGradient>
                    <Text style={[styles.addNewClientText, { color: theme.primary }]}>{t('addClient')}</Text>
                  </TouchableOpacity>
                  <FlatList data={clients} keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.clientOption, { borderBottomColor: theme.border }]}
                      onPress={() => { setSelectedClient(item); setShowClientPicker(false); }}>
                      <LinearGradient colors={theme.gradients.primary} style={styles.clientOptionAvatar}>
                        <Text style={styles.clientOptionAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </LinearGradient>
                      <View style={styles.clientOptionInfo}>
                        <Text style={[styles.clientOptionName, { color: theme.text }]}>{item.name}</Text>
                        {item.company ? <Text style={[styles.clientOptionCompany, { color: theme.textSecondary }]}>{item.company}</Text> : null}
                      </View>
                    </TouchableOpacity>
                  )}
                />
                </>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  closeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  placeholder: { width: 40 },
  content: { flex: 1, paddingHorizontal: 20 },
  typeSelector: { flexDirection: 'row', gap: 12, marginTop: 20 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  typeButtonText: { fontSize: 16, fontWeight: '600' },
  typeButtonTextActive: { color: '#fff' },
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginBottom: 24 },
  currencySymbol: { fontSize: 40, fontWeight: 'bold', marginRight: 8 },
  amountInput: { fontSize: 48, fontWeight: 'bold', minWidth: 100, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 20 },
  clientSelector: { borderRadius: 12, padding: 16 },
  selectedClient: { flexDirection: 'row', alignItems: 'center' },
  clientAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600' },
  clientCompany: { fontSize: 13, marginTop: 2 },
  clientPlaceholder: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientPlaceholderText: { fontSize: 16 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  categoryItem: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 12 },
  categoryIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  categoryName: { fontSize: 12, textAlign: 'center' },
  descriptionInput: { borderRadius: 12, padding: 16, fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  dateInput: { borderRadius: 12, padding: 16, fontSize: 16 },
  bottomSpacer: { height: 100 },
  submitContainer: { padding: 20, borderTopWidth: 1 },
  submitButton: { flexDirection: 'row', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  emptyClients: { alignItems: 'center', paddingVertical: 40 },
  emptyClientsText: { fontSize: 14, marginTop: 12, marginBottom: 20 },
  addClientButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  addClientButtonText: { color: '#fff', fontWeight: '600' },
  addNewClientRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderBottomWidth: 1 },
  addNewClientIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  addNewClientText: { fontSize: 16, fontWeight: '600' },
  clientOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  clientOptionAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  clientOptionAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  clientOptionInfo: { flex: 1 },
  clientOptionName: { fontSize: 16, fontWeight: '600' },
  clientOptionCompany: { fontSize: 13, marginTop: 2 },
});
