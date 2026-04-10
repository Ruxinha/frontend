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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, Client } from '../../src/store/useStore';
import { useAuth } from '../../src/context/AuthContext';
import { clientsApi } from '../../src/api/client';
import { CURRENCIES } from '../../src/theme/colors';

export default function ClientsScreen() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const { clients, setClients, removeClient } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';
  const formatCurrency = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;

  const loadData = useCallback(async () => {
    try {
      const params = searchQuery ? { search: searchQuery } : {};
      const response = await clientsApi.getAll(params);
      setClients(response.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (client: Client) => {
    Alert.alert(t('deleteClient'), t('confirmDeleteClient'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await clientsApi.delete(client.id);
            removeClient(client.id);
          } catch (error) {
            Alert.alert(t('error'), 'Failed to delete');
          }
        },
      },
    ]);
  };

  const renderClient = ({ item }: { item: Client }) => (
    <TouchableOpacity
      style={[styles.clientItem, { backgroundColor: theme.card }]}
      onPress={() => router.push({ pathname: '/client-detail', params: { id: item.id } })}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <LinearGradient colors={theme.gradients.primary} style={styles.clientAvatar}>
        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
      </LinearGradient>
      <View style={styles.clientInfo}>
        <Text style={[styles.clientName, { color: theme.text }]}>{item.name}</Text>
        {item.company ? (
          <Text style={[styles.clientCompany, { color: theme.textSecondary }]}>{item.company}</Text>
        ) : null}
        <View style={styles.clientMeta}>
          {item.email ? (
            <View style={styles.metaItem}>
              <Ionicons name="mail-outline" size={12} color={theme.textMuted} />
              <Text style={[styles.metaText, { color: theme.textMuted }]} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.clientStats}>
        <Text style={[styles.revenueAmount, { color: theme.success }]}>
          {formatCurrency(item.total_revenue)}
        </Text>
        <Text style={[styles.revenueLabel, { color: theme.textMuted }]}>
          {item.transaction_count} {t('sales')}
        </Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('clients')}</Text>
        <TouchableOpacity onPress={() => router.push('/add-client')}>
          <LinearGradient colors={theme.gradients.primary} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="search" size={20} color={theme.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={t('searchClients')}
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadData}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); loadData(); }}>
            <Ionicons name="close-circle" size={20} color={theme.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={[styles.statItem, { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, { color: theme.text }]}>{clients.length}</Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('totalClients')}</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: theme.card }]}>
          <Text style={[styles.statValue, { color: theme.success }]}>
            {formatCurrency(clients.reduce((sum, c) => sum + c.total_revenue, 0))}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{t('totalRevenue')}</Text>
        </View>
      </View>

      {/* Clients List */}
      {clients.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: theme.text }]}>{t('noClients')}</Text>
          <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>{t('addFirstClient')}</Text>
          <TouchableOpacity onPress={() => router.push('/add-client')}>
            <LinearGradient colors={theme.gradients.primary} style={styles.emptyStateButton}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyStateButtonText}>{t('addClient')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderClient}
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, marginLeft: 12 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 16 },
  statItem: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '600' },
  clientCompany: { fontSize: 13, marginTop: 2 },
  clientMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11 },
  clientStats: { alignItems: 'flex-end' },
  revenueAmount: { fontSize: 16, fontWeight: 'bold' },
  revenueLabel: { fontSize: 11, marginTop: 2 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptyStateText: { fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 },
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
