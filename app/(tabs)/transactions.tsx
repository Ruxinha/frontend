import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, Transaction } from '../../src/store/useStore';
import { useAuth } from '../../src/context/AuthContext';
import { transactionsApi, categoriesApi } from '../../src/api/client';
import { CURRENCIES } from '../../src/theme/colors';
import { formatDate } from '../../src/utils/formatters';

export default function TransactionsScreen() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const { transactions, setTransactions, setCategories, removeTransaction } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';
  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;

  const loadData = useCallback(async () => {
    try {
      const params = filter !== 'all' ? { type: filter } : {};
      const [transRes, catRes] = await Promise.all([
        transactionsApi.getAll(params),
        categoriesApi.getAll(),
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(t('deleteTransaction'), t('confirmDeleteTransaction'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionsApi.delete(transaction.id);
            removeTransaction(transaction.id);
          } catch (error) {
            Alert.alert(t('error'), 'Failed to delete');
          }
        },
      },
    ]);
  };

  const filters = [
    { key: 'all', label: t('all') },
    { key: 'income', label: t('income') },
    { key: 'expense', label: t('expenses') },
  ];

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={[styles.transactionItem, { backgroundColor: theme.card }]}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <View style={styles.transactionLeft}>
        <LinearGradient
          colors={item.type === 'income' ? theme.gradients.success : theme.gradients.danger}
          style={styles.transactionIcon}
        >
          <Ionicons
            name={item.type === 'income' ? 'arrow-down' : 'arrow-up'}
            size={20}
            color="#fff"
          />
        </LinearGradient>
        <View style={styles.transactionDetails}>
          <Text style={[styles.transactionCategory, { color: theme.text }]}>
            {item.category_name}
          </Text>
          {item.client_name && (
            <Text style={[styles.transactionClient, { color: theme.primary }]}>
              {item.client_name}
            </Text>
          )}
          <Text style={[styles.transactionDescription, { color: theme.textMuted }]} numberOfLines={1}>
            {item.description || t('noDescription')}
          </Text>
          <Text style={[styles.transactionDate, { color: theme.textMuted }]}>
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            { color: item.type === 'income' ? theme.success : theme.danger },
          ]}
        >
          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
        </Text>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/dados')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('transactions')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/add-transaction')}>
          <LinearGradient colors={theme.gradients.primary} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={styles.filterButton}
            onPress={() => setFilter(f.key as any)}
          >
            {filter === f.key ? (
              <LinearGradient colors={theme.gradients.primary} style={styles.filterButtonGradient}>
                <Text style={styles.filterButtonTextActive}>{f.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.filterButtonInactive, { backgroundColor: theme.card }]}>
                <Text style={[styles.filterButtonText, { color: theme.textSecondary }]}>{f.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Transactions List */}
      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{t('noTransactions')}</Text>
          <TouchableOpacity
            onPress={() => router.push('/add-transaction')}
          >
            <LinearGradient colors={theme.gradients.primary} style={styles.emptyStateButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>{t('addTransaction')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 8,
  },
  filterButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  filterButtonGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  filterButtonInactive: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  filterButtonText: { fontWeight: '600' },
  filterButtonTextActive: { color: '#fff', fontWeight: '600' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  transactionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionCategory: { fontSize: 16, fontWeight: '600' },
  transactionClient: { fontSize: 12, marginTop: 1 },
  transactionDescription: { fontSize: 13, marginTop: 2 },
  transactionDate: { fontSize: 12, marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  transactionAmount: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  deleteButton: { padding: 4 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16, marginBottom: 24 },
  emptyStateButton: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  emptyStateButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
