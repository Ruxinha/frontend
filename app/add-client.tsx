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
import { clientsApi } from '../src/api/client';

export default function AddClient() {
  const router = useRouter();
  const { theme, t } = useAuth();
  const { addClient } = useStore();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('individual');
  const [nif, setNif] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) { Alert.alert(t('error'), t('enterAmount')); return; }
    setLoading(true);
    try {
      const response = await clientsApi.create({ name: name.trim(), type, nif: nif.trim(), email: email.trim(), phone: phone.trim(), company: type === 'company' ? company.trim() : '', address: address.trim(), notes: notes.trim() });
      addClient(response.data);
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('addClient')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.previewContainer, { backgroundColor: theme.card }]}>
            <LinearGradient colors={theme.gradients.primary} style={styles.previewAvatar}>
              <Text style={styles.previewAvatarText}>{name ? name.charAt(0).toUpperCase() : '?'}</Text>
            </LinearGradient>
            <Text style={[styles.previewName, { color: theme.text }]}>{name || t('client')}</Text>
            {company ? <Text style={[styles.previewCompany, { color: theme.textSecondary }]}>{company}</Text> : null}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('clientType') || 'Tipo de Cliente'}</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity 
              style={[styles.typeOption, { backgroundColor: type === 'individual' ? theme.primary : theme.card }]}
              onPress={() => setType('individual')}
            >
              <Ionicons name="person" size={20} color={type === 'individual' ? '#fff' : theme.textMuted} />
              <Text style={[styles.typeText, { color: type === 'individual' ? '#fff' : theme.text }]}>{t('individual') || 'Particular'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.typeOption, { backgroundColor: type === 'company' ? theme.primary : theme.card }]}
              onPress={() => setType('company')}
            >
              <Ionicons name="business" size={20} color={type === 'company' ? '#fff' : theme.textMuted} />
              <Text style={[styles.typeText, { color: type === 'company' ? '#fff' : theme.text }]}>{t('companyType') || 'Empresa'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('basicInfo')}</Text>
          <View style={styles.inputGroup}>
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="person-outline" size={20} color={theme.textMuted} />
              <TextInput style={[styles.input, { color: theme.text }]} placeholder={t('clientNamePlaceholder')} placeholderTextColor={theme.textMuted} value={name} onChangeText={setName} />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="card-outline" size={20} color={theme.textMuted} />
              <TextInput style={[styles.input, { color: theme.text }]} placeholder={t('nifPlaceholder')} placeholderTextColor={theme.textMuted} keyboardType="numeric" value={nif} onChangeText={setNif} />
            </View>
            {type === 'company' && (
              <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="business-outline" size={20} color={theme.textMuted} />
                <TextInput style={[styles.input, { color: theme.text }]} placeholder={t('companyPlaceholder')} placeholderTextColor={theme.textMuted} value={company} onChangeText={setCompany} />
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('contactInfo')}</Text>
          <View style={styles.inputGroup}>
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
              <TextInput style={[styles.input, { color: theme.text }]} placeholder={t('emailPlaceholder')} placeholderTextColor={theme.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="call-outline" size={20} color={theme.textMuted} />
              <TextInput style={[styles.input, { color: theme.text }]} placeholder={t('phonePlaceholder')} placeholderTextColor={theme.textMuted} keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            </View>
            <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
              <Ionicons name="location-outline" size={20} color={theme.textMuted} />
              <TextInput style={[styles.input, styles.multilineInput, { color: theme.text }]} placeholder={t('addressPlaceholder')} placeholderTextColor={theme.textMuted} multiline value={address} onChangeText={setAddress} />
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('notes')}</Text>
          <TextInput style={[styles.notesInput, { backgroundColor: theme.card, color: theme.text }]} placeholder={t('addNotesAboutClient')} placeholderTextColor={theme.textMuted} multiline value={notes} onChangeText={setNotes} />
          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={[styles.submitContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity onPress={handleSubmit} disabled={loading || !name.trim()}>
            <LinearGradient colors={!name.trim() ? ['#475569', '#334155'] : theme.gradients.primary} style={styles.submitButton}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <><Ionicons name="person-add" size={20} color="#fff" /><Text style={styles.submitButtonText}>{t('addClient')}</Text></>
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
  previewAvatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  previewAvatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  previewName: { fontSize: 20, fontWeight: '600' },
  previewCompany: { fontSize: 14, marginTop: 4 },
  typeSelector: { flexDirection: 'row', gap: 12 },
  typeOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  typeText: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginTop: 24 },
  inputGroup: { gap: 12 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, paddingVertical: 16, marginLeft: 12 },
  multilineInput: { minHeight: 60, textAlignVertical: 'top' },
  notesInput: { borderRadius: 12, padding: 16, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  bottomSpacer: { height: 100 },
  submitContainer: { padding: 20, borderTopWidth: 1 },
  submitButton: { flexDirection: 'row', paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
