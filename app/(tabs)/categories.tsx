import React, { useEffect, useState, useCallback } from 'react';
import { webAlert } from '../../src/utils/alert';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
  ActivityIndicator, Alert, Modal, ScrollView, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore, Category } from '../../src/store/useStore';
import { useAuth } from '../../src/context/AuthContext';
import { categoriesApi } from '../../src/api/client';

const PALETTE_COLORS = [
  '#6C63FF', '#FF6584', '#4CAF50', '#FF9800', '#2196F3', '#9C27B0',
  '#00BCD4', '#E91E63', '#8BC34A', '#FF5722', '#795548', '#607D8B',
];

const ICONS = [
  { name: 'cash', icon: 'cash-outline' }, { name: 'cart', icon: 'cart-outline' },
  { name: 'briefcase', icon: 'briefcase-outline' }, { name: 'home', icon: 'home-outline' },
  { name: 'flash', icon: 'flash-outline' }, { name: 'cube', icon: 'cube-outline' },
  { name: 'megaphone', icon: 'megaphone-outline' }, { name: 'people', icon: 'people-outline' },
  { name: 'airplane', icon: 'airplane-outline' }, { name: 'receipt', icon: 'receipt-outline' },
  { name: 'trending-up', icon: 'trending-up-outline' }, { name: 'card', icon: 'card-outline' },
  { name: 'gift', icon: 'gift-outline' }, { name: 'restaurant', icon: 'restaurant-outline' },
  { name: 'car', icon: 'car-outline' }, { name: 'medical', icon: 'medical-outline' },
  { name: 'school', icon: 'school-outline' }, { name: 'construct', icon: 'construct-outline' },
];

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

export default function CategoriesScreen() {
  const router = useRouter();
  const { theme, t } = useAuth();
  const { categories, setCategories, removeCategory, updateCategory } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Edit modal state
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');
  const [editColor, setEditColor] = useState(PALETTE_COLORS[0]);
  const [editIcon, setEditIcon] = useState(ICONS[0].name);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  const filtered = filter === 'all' ? categories : categories.filter((c) => c.type === filter);

  const openEdit = (cat: Category) => {
    setEditCategory(cat);
    setEditName(cat.name);
    setEditType(cat.type as 'income' | 'expense');
    setEditColor(cat.color);
    setEditIcon(cat.icon);
  };

  const handleSave = async () => {
    if (!editCategory || !editName.trim()) return;
    setSaving(true);
    try {
      const updates = { name: editName.trim(), type: editType, color: editColor, icon: editIcon };
      await categoriesApi.update(editCategory.id, updates);
      updateCategory(editCategory.id, updates);
      setEditCategory(null);
    } catch (error) {
      webAlert(t('error'), t('failedToCreate'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (cat: Category) => {
    categoriesApi.delete(cat.id).then(() => removeCategory(cat.id)).catch(() => {});
  };

  const filters = [
    { key: 'all', label: t('all') },
    { key: 'income', label: t('income') },
    { key: 'expense', label: t('expenses') },
  ];

  const incomeCount = categories.filter((c) => c.type === 'income').length;
  const expenseCount = categories.filter((c) => c.type === 'expense').length;

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={[styles.categoryItem, { backgroundColor: theme.card }]}>
      <TouchableOpacity style={styles.categoryMain} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={getIconName(item.icon) as any} size={22} color={item.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[styles.categoryName, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.categoryType, { color: item.type === 'income' ? theme.success : theme.danger }]}>
            {item.type === 'income' ? t('income') : t('expenses')}
          </Text>
        </View>
        <Ionicons name="create-outline" size={20} color={theme.textMuted} />
      </TouchableOpacity>
    </View>
  );

  if (loading) return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.primary} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.navigate('/(tabs)/dados')} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('categories')}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/add-category')}>
          <LinearGradient colors={theme.gradients.primary} style={styles.addButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity key={f.key} style={styles.filterButton} onPress={() => setFilter(f.key)}>
            {filter === f.key ? (
              <LinearGradient colors={theme.gradients.primary} style={styles.filterGradient}>
                <Text style={styles.filterTextActive}>{f.label}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.filterInactive, { backgroundColor: theme.card }]}>
                <Text style={[styles.filterText, { color: theme.textSecondary }]}>{f.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Summary */}
      <View style={[styles.summary, { backgroundColor: theme.card }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.success }]}>{incomeCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('income')}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: theme.danger }]}>{expenseCount}</Text>
          <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{t('expenses')}</Text>
        </View>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={48} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.textMuted }]}>{t('noCategories')}</Text>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={renderCategory}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} />
      )}

      {/* Edit Modal */}
      <Modal visible={!!editCategory} animationType="slide" transparent onRequestClose={() => setEditCategory(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
              <TouchableOpacity onPress={() => setEditCategory(null)}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t('edit')}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={handleSave}>{saving ? <ActivityIndicator color={theme.primary} size="small" /> : <Ionicons name="checkmark" size={24} color={theme.primary} />}</TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditCategory(null); if (editCategory) handleDelete(editCategory); }} style={{ marginLeft: 16 }}>
                  <Ionicons name="trash-outline" size={22} color={theme.danger} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Preview */}
              <View style={[styles.previewCard, { backgroundColor: theme.card }]}>
                <View style={[styles.previewIcon, { backgroundColor: editColor + '20' }]}>
                  <Ionicons name={getIconName(editIcon) as any} size={32} color={editColor} />
                </View>
                <Text style={[styles.previewName, { color: theme.text }]}>{editName || '...'}</Text>
                <View style={[styles.previewBadge, { backgroundColor: editType === 'income' ? theme.success + '20' : theme.danger + '20' }]}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: editType === 'income' ? theme.success : theme.danger }}>
                    {editType === 'income' ? t('income') : t('expenses')}
                  </Text>
                </View>
              </View>

              {/* Name */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categoryName')}</Text>
              <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                value={editName} onChangeText={setEditName} placeholder={t('enterCategoryName')} placeholderTextColor={theme.textMuted} />

              {/* Type */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('type')}</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity style={[styles.typeBtn, editType === 'expense' && { borderColor: theme.danger, borderWidth: 2 }, { backgroundColor: theme.card }]} onPress={() => setEditType('expense')}>
                  <Ionicons name="arrow-up-outline" size={18} color={theme.danger} />
                  <Text style={[styles.typeBtnText, { color: editType === 'expense' ? theme.danger : theme.textSecondary }]}>{t('expenses')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, editType === 'income' && { borderColor: theme.success, borderWidth: 2 }, { backgroundColor: theme.card }]} onPress={() => setEditType('income')}>
                  <Ionicons name="arrow-down-outline" size={18} color={theme.success} />
                  <Text style={[styles.typeBtnText, { color: editType === 'income' ? theme.success : theme.textSecondary }]}>{t('income')}</Text>
                </TouchableOpacity>
              </View>

              {/* Color */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('color')}</Text>
              <View style={styles.colorGrid}>
                {PALETTE_COLORS.map((color) => (
                  <TouchableOpacity key={color} style={[styles.colorOption, { backgroundColor: color }, editColor === color && styles.colorSelected]} onPress={() => setEditColor(color)}>
                    {editColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Icon */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('icon')}</Text>
              <View style={styles.iconGrid}>
                {ICONS.map((ic) => (
                  <TouchableOpacity key={ic.name}
                    style={[styles.iconOption, { backgroundColor: theme.card }, editIcon === ic.name && { backgroundColor: editColor + '20', borderColor: editColor, borderWidth: 2 }]}
                    onPress={() => setEditIcon(ic.name)}
                  >
                    <Ionicons name={ic.icon as any} size={22} color={editIcon === ic.name ? editColor : theme.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Save Button */}
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ marginTop: 24 }}>
                <LinearGradient colors={theme.gradients.primary} style={styles.saveButton}>
                  {saving ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={20} color="#fff" /><Text style={styles.saveButtonText}>{t('saveChanges')}</Text></>}
                </LinearGradient>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
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
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { padding: 4 },
  addButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 },
  filterButton: {},
  filterGradient: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterInactive: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterTextActive: { color: '#fff', fontWeight: '600', fontSize: 14 },
  filterText: { fontSize: 14 },
  summary: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 14, padding: 16, marginBottom: 12 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: 'bold' },
  summaryLabel: { fontSize: 13, marginTop: 2 },
  summaryDivider: { width: 1, marginHorizontal: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  // Category item
  categoryItem: { borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  categoryMain: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  categoryIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryType: { fontSize: 13, marginTop: 2 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { flex: 1, marginTop: 50, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalActions: { flexDirection: 'row', alignItems: 'center' },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  // Preview
  previewCard: { borderRadius: 16, padding: 24, marginTop: 16, alignItems: 'center' },
  previewIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  previewName: { fontSize: 20, fontWeight: 'bold' },
  previewBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  // Form
  sectionTitle: { fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 12, padding: 16, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'transparent' },
  typeBtnText: { fontSize: 15, fontWeight: '600' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorOption: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  colorSelected: { borderWidth: 3, borderColor: '#fff' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconOption: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
