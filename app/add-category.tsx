import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store/useStore';
import { useAuth } from '../src/context/AuthContext';
import { categoriesApi } from '../src/api/client';

const PALETTE_COLORS = [
  '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
  '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
  '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
  '#FF5722', '#795548', '#607D8B',
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

export default function AddCategory() {
  const router = useRouter();
  const { theme, t } = useAuth();
  const { addCategory } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [selectedColor, setSelectedColor] = useState(PALETTE_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0].name);

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert(t('error'), t('enterCategoryName')); return; }
    setLoading(true);
    try {
      const response = await categoriesApi.create({ name: name.trim(), type, color: selectedColor, icon: selectedIcon });
      addCategory(response.data);
      router.back();
    } catch (error) { Alert.alert(t('error'), t('failedToCreate')); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('addCategory')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.previewContainer, { backgroundColor: theme.card }]}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor + '30' }]}>
              <Ionicons name={(ICONS.find((i) => i.name === selectedIcon)?.icon as any) || 'ellipse-outline'} size={32} color={selectedColor} />
            </View>
            <Text style={[styles.previewName, { color: theme.text }]}>{name || t('categoryName')}</Text>
            <View style={[styles.previewBadge, { backgroundColor: type === 'income' ? theme.success + '20' : theme.danger + '20' }]}>
              <Text style={[styles.previewBadgeText, { color: type === 'income' ? theme.success : theme.danger }]}>{type === 'income' ? t('income') : t('expenses')}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('categoryName')}</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} placeholder={t('enterCategoryName')} placeholderTextColor={theme.textMuted} value={name} onChangeText={setName} />

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('type')}</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity style={[styles.typeButton, { backgroundColor: theme.card }, type === 'income' && { backgroundColor: theme.success }]} onPress={() => setType('income')}>
              <Ionicons name="arrow-down" size={20} color={type === 'income' ? '#fff' : theme.success} />
              <Text style={[styles.typeButtonText, { color: theme.textSecondary }, type === 'income' && styles.typeButtonTextActive]}>{t('income')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeButton, { backgroundColor: theme.card }, type === 'expense' && { backgroundColor: theme.danger }]} onPress={() => setType('expense')}>
              <Ionicons name="arrow-up" size={20} color={type === 'expense' ? '#fff' : theme.danger} />
              <Text style={[styles.typeButtonText, { color: theme.textSecondary }, type === 'expense' && styles.typeButtonTextActive]}>{t('expenses')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('color')}</Text>
          <View style={styles.colorGrid}>
            {PALETTE_COLORS.map((color) => (
              <TouchableOpacity key={color} style={[styles.colorItem, { backgroundColor: color }, selectedColor === color && styles.colorItemSelected]} onPress={() => setSelectedColor(color)}>
                {selectedColor === color && <Ionicons name="checkmark" size={16} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('icon')}</Text>
          <View style={styles.iconGrid}>
            {ICONS.map((iconItem) => (
              <TouchableOpacity key={iconItem.name} style={[styles.iconItem, { backgroundColor: theme.card }, selectedIcon === iconItem.name && { backgroundColor: theme.cardLight, borderWidth: 2, borderColor: theme.primary }]} onPress={() => setSelectedIcon(iconItem.name)}>
                <Ionicons name={iconItem.icon as any} size={24} color={selectedIcon === iconItem.name ? selectedColor : theme.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={[styles.submitContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || !name.trim()}>
            <LinearGradient colors={!name.trim() ? ['#475569', '#334155'] : theme.gradients.primary} style={styles.submitButton}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <><Ionicons name="checkmark" size={20} color="#fff" /><Text style={styles.submitButtonText}>{t('addCategory')}</Text></>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  previewContainer: { alignItems: 'center', paddingVertical: 32, marginTop: 12, borderRadius: 16 },
  previewIcon: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  previewName: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  previewBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  previewBadgeText: { fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 24 },
  input: { borderRadius: 12, padding: 16, fontSize: 16 },
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  typeButtonText: { fontSize: 16, fontWeight: '600' },
  typeButtonTextActive: { color: '#fff' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorItem: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  colorItemSelected: { borderWidth: 3, borderColor: '#fff' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  iconItem: { width: 52, height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  bottomSpacer: { height: 100 },
  submitContainer: { padding: 20, borderTopWidth: 1 },
  submitButton: { flexDirection: 'row', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
