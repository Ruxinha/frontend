import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { transactionsApi, reportsApi, categoriesApi } from '../../src/api/client';
import { CURRENCIES } from '../../src/theme/colors';

export default function DadosScreen() {
  const router = useRouter();
  const { theme, t, currency } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    transactionCount: 0,
    categoryCount: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(true);

  const currencySymbol = CURRENCIES[currency]?.symbol || '€';

  const loadStats = useCallback(async () => {
    try {
      const [transRes, summaryRes, catRes] = await Promise.all([
        transactionsApi.getAll({}),
        reportsApi.getSummary('all'),
        categoriesApi.getAll(),
      ]);
      setStats({
        transactionCount: transRes.data?.length || 0,
        categoryCount: catRes.data?.length || 0,
        netProfit: (summaryRes.data?.total_income || 0) - (summaryRes.data?.total_expenses || 0),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const menuItems = [
    {
      key: 'transactions',
      icon: 'swap-horizontal' as const,
      title: t('manageTransactions'),
      description: t('manageTransactionsDesc'),
      gradient: theme.gradients.primary,
      badge: `${stats.transactionCount}`,
      onPress: () => router.push('/(tabs)/transactions'),
    },
    {
      key: 'reports',
      icon: 'stats-chart' as const,
      title: t('viewReports'),
      description: t('viewReportsDesc'),
      gradient: theme.gradients.success,
      badge: `${currencySymbol}${stats.netProfit.toFixed(0)}`,
      onPress: () => router.push('/(tabs)/reports'),
    },
    {
      key: 'categories',
      icon: 'grid' as const,
      title: t('manageCategories'),
      description: t('manageCategoriesDesc'),
      gradient: theme.gradients.accent,
      badge: `${stats.categoryCount}`,
      onPress: () => router.push('/(tabs)/categories'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('data')}</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {t('dataDescription')}
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, { backgroundColor: theme.card }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <LinearGradient colors={item.gradient} style={styles.menuIcon}>
                  <Ionicons name={item.icon} size={24} color="#fff" />
                </LinearGradient>
                <View style={styles.menuTextContainer}>
                  <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.menuDescription, { color: theme.textSecondary }]}>
                    {item.description}
                  </Text>
                </View>
              </View>
              <View style={styles.menuItemRight}>
                <View style={[styles.badge, { backgroundColor: theme.backgroundLight }]}>
                  <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{item.badge}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Export Section */}
        <View style={styles.exportSection}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('dataExport')}</Text>
          <View style={[styles.exportCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={[styles.exportItem, { borderBottomColor: theme.border }]}>
              <View style={styles.exportLeft}>
                <Ionicons name="download-outline" size={20} color={theme.primary} />
                <Text style={[styles.exportText, { color: theme.text }]}>{t('exportTransactions')}</Text>
              </View>
              <Text style={[styles.exportFormat, { color: theme.textMuted }]}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportItem, { borderBottomColor: theme.border }]}>
              <View style={styles.exportLeft}>
                <Ionicons name="download-outline" size={20} color={theme.primary} />
                <Text style={[styles.exportText, { color: theme.text }]}>{t('exportInvoices')}</Text>
              </View>
              <Text style={[styles.exportFormat, { color: theme.textMuted }]}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.exportItem}>
              <View style={styles.exportLeft}>
                <Ionicons name="download-outline" size={20} color={theme.primary} />
                <Text style={[styles.exportText, { color: theme.text }]}>{t('exportReport')}</Text>
              </View>
              <Text style={[styles.exportFormat, { color: theme.textMuted }]}>CSV</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  loadingContainer: { padding: 40, alignItems: 'center' },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  menuContainer: {
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  menuTitle: { fontSize: 16, fontWeight: '600' },
  menuDescription: { fontSize: 13, marginTop: 2 },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { fontSize: 13, fontWeight: '600' },
  exportSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exportCard: { borderRadius: 16, overflow: 'hidden' },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  exportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportText: { fontSize: 15 },
  exportFormat: { fontSize: 13 },
  bottomSpacer: { height: 100 },
});
