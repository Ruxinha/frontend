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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { reportsApi } from '../../src/api/client';
import { CURRENCIES } from '../../src/theme/colors';
import { formatMonthYear } from '../../src/utils/formatters';

const { width } = Dimensions.get('window');

interface TrendData {
  date: string;
  income: number;
  expenses: number;
}

interface MonthlyData {
  [key: string]: { income: number; expenses: number; net: number };
}

export default function ReportsScreen() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('month');
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'monthly'>('overview');

  const currencySymbol = CURRENCIES[currency]?.symbol || '\u20ac';
  const fmtCurrency = (amount: number) => `${currencySymbol}${amount.toFixed(2)}`;

  const loadData = useCallback(async () => {
    try {
      const [summaryRes, trendsRes, monthlyRes] = await Promise.all([
        reportsApi.getSummary(period),
        reportsApi.getTrends(period),
        reportsApi.getMonthly(),
      ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data.trends || []);
      setMonthlyData(monthlyRes.data.monthly_data || {});
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getBarChartData = () => {
    const months = Object.entries(monthlyData).slice(-6);
    return months.flatMap(([month, data]) => [
      { value: data.income, frontColor: theme.success, label: month.split('-')[1], spacing: 2, labelWidth: 30 },
      { value: data.expenses, frontColor: theme.danger },
    ]);
  };

  const getLineChartData = () => {
    if (trends.length === 0) return { income: [], expenses: [] };
    const income = trends.map((tr, i) => ({
      value: tr.income,
      dataPointText: i === trends.length - 1 ? fmtCurrency(tr.income) : '',
    }));
    const expenses = trends.map((tr, i) => ({
      value: tr.expenses,
      dataPointText: i === trends.length - 1 ? fmtCurrency(tr.expenses) : '',
    }));
    return { income, expenses };
  };

  const periods = [
    { key: 'month', label: t('month') },
    { key: 'year', label: t('year') },
    { key: 'all', label: t('total') },
  ];

  const tabs = [
    { key: 'overview', label: t('overview'), icon: 'pie-chart' },
    { key: 'trends', label: t('trends'), icon: 'trending-up' },
    { key: 'monthly', label: t('monthly'), icon: 'calendar' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const lineData = getLineChartData();
  const barData = getBarChartData();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/dados')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{t('reports')}</Text>
          </View>
        </View>

        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabButton}
              onPress={() => setActiveTab(tab.key as any)}
            >
              {activeTab === tab.key ? (
                <LinearGradient colors={theme.gradients.primary} style={styles.tabButtonGradient}>
                  <Ionicons name={tab.icon as any} size={18} color="#fff" />
                  <Text style={styles.tabButtonTextActive}>{tab.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.tabButtonInactive, { backgroundColor: theme.card }]}>
                  <Ionicons name={tab.icon as any} size={18} color={theme.textMuted} />
                  <Text style={[styles.tabButtonText, { color: theme.textSecondary }]}>{tab.label}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'overview' && (
          <>
            <View style={styles.periodSelector}>
              {periods.map((p) => (
                <TouchableOpacity key={p.key} style={styles.periodButton} onPress={() => setPeriod(p.key)}>
                  {period === p.key ? (
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

            <View style={styles.summaryGrid}>
              <LinearGradient colors={theme.gradients.success} style={[styles.summaryCard, { width: (width - 52) / 2 }]}>
                <Ionicons name="arrow-down" size={24} color="#fff" />
                <Text style={styles.summaryLabel}>{t('totalIncome')}</Text>
                <Text style={styles.summaryValue}>{fmtCurrency(summary?.total_income || 0)}</Text>
              </LinearGradient>

              <LinearGradient colors={theme.gradients.danger} style={[styles.summaryCard, { width: (width - 52) / 2 }]}>
                <Ionicons name="arrow-up" size={24} color="#fff" />
                <Text style={styles.summaryLabel}>{t('totalExpenses')}</Text>
                <Text style={styles.summaryValue}>{fmtCurrency(summary?.total_expenses || 0)}</Text>
              </LinearGradient>

              <LinearGradient colors={theme.gradients.purple} style={[styles.summaryCard, { width: (width - 52) / 2 }]}>
                <Ionicons name={(summary?.net_profit || 0) >= 0 ? 'trending-up' : 'trending-down'} size={24} color="#fff" />
                <Text style={styles.summaryLabel}>{t('netProfit')}</Text>
                <Text style={styles.summaryValue}>{fmtCurrency(summary?.net_profit || 0)}</Text>
              </LinearGradient>

              <LinearGradient colors={theme.gradients.blue} style={[styles.summaryCard, { width: (width - 52) / 2 }]}>
                <Ionicons name="receipt" size={24} color="#fff" />
                <Text style={styles.summaryLabel}>{t('transactionCount')}</Text>
                <Text style={styles.summaryValue}>{summary?.transaction_count || 0}</Text>
              </LinearGradient>
            </View>

            {summary?.expense_by_category && Object.keys(summary.expense_by_category).length > 0 && (
              <View style={[styles.breakdownCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{t('expenseBreakdown')}</Text>
                {Object.entries(summary.expense_by_category).map(([cat, amount]) => {
                  const total = summary.total_expenses || 1;
                  const percentage = ((amount as number) / total) * 100;
                  return (
                    <View key={cat} style={styles.breakdownItem}>
                      <View style={styles.breakdownHeader}>
                        <Text style={[styles.breakdownCategory, { color: theme.textSecondary }]}>{cat}</Text>
                        <Text style={[styles.breakdownAmount, { color: theme.textMuted }]}>{fmtCurrency(amount as number)}</Text>
                      </View>
                      <View style={[styles.progressBar, { backgroundColor: theme.background }]}>
                        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: theme.danger }]} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {activeTab === 'trends' && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('incomeVsExpenses')}</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>{t('income')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>{t('expenses')}</Text>
              </View>
            </View>
            {trends.length > 0 ? (
              <View style={styles.chartContainer}>
                <LineChart
                  data={lineData.income}
                  data2={lineData.expenses}
                  height={200}
                  width={width - 80}
                  color1={theme.success}
                  color2={theme.danger}
                  dataPointsColor1={theme.success}
                  dataPointsColor2={theme.danger}
                  spacing={40}
                  initialSpacing={20}
                  yAxisColor={theme.border}
                  xAxisColor={theme.border}
                  yAxisTextStyle={{ color: theme.textMuted, fontSize: 10 }}
                  hideDataPoints={false}
                  curved
                  thickness={2}
                  areaChart
                  startFillColor1={theme.success + '40'}
                  endFillColor1={theme.success + '10'}
                  startFillColor2={theme.danger + '40'}
                  endFillColor2={theme.danger + '10'}
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="analytics-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.noDataText, { color: theme.textMuted }]}>{t('noTrendData')}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'monthly' && (
          <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('monthlyComparison')}</Text>
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>{t('income')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.danger }]} />
                <Text style={[styles.legendText, { color: theme.textSecondary }]}>{t('expenses')}</Text>
              </View>
            </View>
            {barData.length > 0 ? (
              <View style={styles.chartContainer}>
                <BarChart
                  data={barData}
                  barWidth={16}
                  spacing={24}
                  initialSpacing={16}
                  barBorderRadius={4}
                  yAxisColor={theme.border}
                  xAxisColor={theme.border}
                  yAxisTextStyle={{ color: theme.textMuted, fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: theme.textMuted, fontSize: 10 }}
                  height={200}
                  noOfSections={4}
                  hideRules
                />
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="bar-chart-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.noDataText, { color: theme.textMuted }]}>{t('noMonthlyData')}</Text>
              </View>
            )}

            <View style={styles.monthlyList}>
              {Object.entries(monthlyData).slice(-6).reverse().map(([month, data]) => (
                <View key={month} style={[styles.monthlyItem, { borderBottomColor: theme.border }]}>
                  <Text style={[styles.monthlyMonth, { color: theme.textSecondary }]}>{formatMonthYear(month)}</Text>
                  <View style={styles.monthlyValues}>
                    <Text style={{ color: theme.success, fontSize: 12 }}>+{fmtCurrency(data.income)}</Text>
                    <Text style={{ color: theme.danger, fontSize: 12 }}>-{fmtCurrency(data.expenses)}</Text>
                    <Text style={{ color: data.net >= 0 ? theme.success : theme.danger, fontSize: 12, fontWeight: '600' }}>
                      {fmtCurrency(data.net)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginVertical: 16, gap: 8 },
  tabButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  tabButtonGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 6,
  },
  tabButtonInactive: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderRadius: 12, gap: 6,
  },
  tabButtonText: { fontWeight: '600', fontSize: 13 },
  tabButtonTextActive: { color: '#fff', fontWeight: '600', fontSize: 13 },
  periodSelector: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 8 },
  periodButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  periodButtonGradient: { paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  periodButtonInactive: { paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  periodButtonText: { fontWeight: '600' },
  periodButtonTextActive: { color: '#fff', fontWeight: '600' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12 },
  summaryCard: { borderRadius: 16, padding: 16 },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 8 },
  summaryValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  breakdownCard: { marginHorizontal: 20, marginTop: 20, borderRadius: 16, padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  breakdownItem: { marginBottom: 16 },
  breakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  breakdownCategory: { fontSize: 14 },
  breakdownAmount: { fontSize: 14 },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  chartCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 20 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12 },
  chartContainer: { alignItems: 'center', marginTop: 8 },
  noDataContainer: { alignItems: 'center', paddingVertical: 40 },
  noDataText: { fontSize: 14, marginTop: 12 },
  monthlyList: { marginTop: 20 },
  monthlyItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1,
  },
  monthlyMonth: { fontSize: 14, fontWeight: '500' },
  monthlyValues: { flexDirection: 'row', gap: 16 },
  bottomSpacer: { height: 100 },
});
