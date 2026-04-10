import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { useStore } from '../../src/store/useStore';
import { useAuth } from '../../src/context/AuthContext';
import { transactionsApi, reportsApi, categoriesApi } from '../../src/api/client';
import { CURRENCIES } from '../../src/theme/colors';
import GradientButton from '../../src/components/GradientButton';
import { formatDate } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const router = useRouter();
  const { user, theme, t, currency } = useAuth();
  const {
    transactions,
    summary,
    categories,
    setTransactions,
    setSummary,
    setCategories,
    isLoading,
    setLoading,
  } = useStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transRes, summaryRes, catRes] = await Promise.all([
        transactionsApi.getAll({ limit: 5 }),
        reportsApi.getSummary(selectedPeriod),
        categoriesApi.getAll(),
      ]);
      setTransactions(transRes.data);
      setSummary(summaryRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getPieChartData = () => {
    if (!summary?.expense_by_category) return [];
    const colors = ['#EC4899', '#8B5CF6', '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
    return Object.entries(summary.expense_by_category).map(([name, value], index) => ({
      value: value as number,
      color: colors[index % colors.length],
      text: name,
      focused: index === 0,
    }));
  };

  const periods = [
    { key: 'month', label: t('month') },
    { key: 'year', label: t('year') },
    { key: 'all', label: t('total') },
  ];

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const pieData = getPieChartData();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header with Profile Photo */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {user?.profile_photo ? (
              <Image source={{ uri: user.profile_photo }} style={styles.profilePhoto} />
            ) : (
              <LinearGradient
                colors={theme.gradients.primary}
                style={styles.profilePhotoPlaceholder}
              >
                <Text style={styles.profilePhotoText}>
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
            <View>
              <Text style={[styles.greeting, { color: theme.text }]}>
                {t('hello')}, {user?.name?.split(' ')[0] || 'User'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                {t('overviewFinances')}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/add-transaction')}>
            <LinearGradient colors={theme.gradients.primary} style={styles.addButton}>
              <Ionicons name="add" size={24} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodButton]}
              onPress={() => setSelectedPeriod(p.key)}
            >
              {selectedPeriod === p.key ? (
                <LinearGradient colors={theme.gradients.primary} style={styles.periodButtonGradient}>
                  <Text style={styles.periodButtonTextActive}>{p.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.periodButtonInactive, { backgroundColor: theme.card }]}>
                  <Text style={[styles.periodButtonText, { color: theme.textSecondary }]}>{p.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <LinearGradient colors={theme.gradients.success} style={styles.summaryCard}>
            <View style={styles.summaryIconBg}>
              <Ionicons name="arrow-down" size={20} color={theme.success} />
            </View>
            <Text style={styles.summaryLabel}>{t('income')}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary?.total_income || 0)}</Text>
          </LinearGradient>

          <LinearGradient colors={theme.gradients.danger} style={styles.summaryCard}>
            <View style={styles.summaryIconBg}>
              <Ionicons name="arrow-up" size={20} color={theme.danger} />
            </View>
            <Text style={styles.summaryLabel}>{t('expenses')}</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary?.total_expenses || 0)}</Text>
          </LinearGradient>
        </View>

        {/* Net Profit Card */}
        <LinearGradient
          colors={(summary?.net_profit || 0) >= 0 ? theme.gradients.purple : ['#7F1D1D', '#991B1B']}
          style={styles.profitCard}
        >
          <View>
            <Text style={styles.profitLabel}>{t('netProfit')}</Text>
            <Text style={styles.profitAmount}>{formatCurrency(summary?.net_profit || 0)}</Text>
          </View>
          <Ionicons
            name={(summary?.net_profit || 0) >= 0 ? 'trending-up' : 'trending-down'}
            size={40}
            color="rgba(255,255,255,0.3)"
          />
        </LinearGradient>

        {/* Expense Chart */}
        {pieData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('expenseBreakdown')}</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={50}
                innerCircleColor={theme.card}
                centerLabelComponent={() => (
                  <View style={styles.chartCenter}>
                    <Ionicons name="pie-chart" size={24} color={theme.primary} />
                  </View>
                )}
              />
            </View>
            <View style={styles.legendContainer}>
              {pieData.map((item, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>{item.text}</Text>
                  <Text style={[styles.legendValue, { color: theme.text }]}>{formatCurrency(item.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('recentTransactions')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={[styles.seeAllText, { color: theme.primary }]}>{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
              <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyStateText, { color: theme.textMuted }]}>{t('noTransactions')}</Text>
              <GradientButton
                title={t('addTransaction')}
                onPress={() => router.push('/add-transaction')}
                variant="primary"
                style={styles.emptyStateButton}
              />
            </View>
          ) : (
            transactions.slice(0, 5).map((transaction) => (
              <View key={transaction.id} style={[styles.transactionItem, { backgroundColor: theme.card }]}>
                <View style={styles.transactionLeft}>
                  <LinearGradient
                    colors={transaction.type === 'income' ? theme.gradients.success : theme.gradients.danger}
                    style={styles.transactionIcon}
                  >
                    <Ionicons
                      name={transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}
                      size={18}
                      color="#fff"
                    />
                  </LinearGradient>
                  <View style={styles.transactionDetails}>
                    <Text style={[styles.transactionCategory, { color: theme.text }]}>
                      {transaction.category_name}
                    </Text>
                    {transaction.client_name && (
                      <Text style={[styles.transactionClient, { color: theme.primary }]}>
                        {transaction.client_name}
                      </Text>
                    )}
                    <Text style={[styles.transactionDescription, { color: theme.textMuted }]}>
                      {transaction.description || t('noDescription')}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: transaction.type === 'income' ? theme.success : theme.danger },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profilePhoto: { width: 48, height: 48, borderRadius: 24 },
  profilePhotoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePhotoText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  greeting: { fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 16,
    gap: 8,
  },
  periodButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  periodButtonGradient: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  periodButtonInactive: { paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  periodButtonText: { fontWeight: '600' },
  periodButtonTextActive: { color: '#fff', fontWeight: '600' },
  summaryContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  summaryCard: { flex: 1, borderRadius: 20, padding: 16 },
  summaryIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 4 },
  summaryAmount: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  profitCard: {
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  profitAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  chartCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 20, padding: 20 },
  chartContainer: { alignItems: 'center', marginVertical: 16 },
  chartCenter: { justifyContent: 'center', alignItems: 'center' },
  legendContainer: { marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  legendColor: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  legendText: { flex: 1, fontSize: 14 },
  legendValue: { fontSize: 14, fontWeight: '500' },
  sectionTitle: { fontSize: 18, fontWeight: '600' },
  recentSection: { marginHorizontal: 20, marginTop: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: { fontSize: 14, fontWeight: '600' },
  emptyState: { borderRadius: 20, padding: 32, alignItems: 'center' },
  emptyStateText: { fontSize: 16, marginTop: 12, marginBottom: 16 },
  emptyStateButton: { width: '100%' },
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
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionCategory: { fontSize: 15, fontWeight: '600' },
  transactionClient: { fontSize: 12, marginTop: 1 },
  transactionDescription: { fontSize: 13, marginTop: 2 },
  transactionAmount: { fontSize: 16, fontWeight: 'bold' },
  bottomSpacer: { height: 100 },
});
