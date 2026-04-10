import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, UserSettings } from '../../src/context/AuthContext';
import { CURRENCIES, LANGUAGES } from '../../src/theme/colors';
import GradientButton from '../../src/components/GradientButton';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, theme, t, isDarkMode, language, currency, logout, updateSettings, updateProfile } = useAuth();

  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [lang, setLang] = useState(language);
  const [curr, setCurr] = useState(currency);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const handleSaveSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const settings: UserSettings = {
        dark_mode: newSettings.dark_mode ?? darkMode,
        language: newSettings.language ?? lang,
        currency: newSettings.currency ?? curr,
      };
      await updateSettings(settings);
    } catch (error) {
      Alert.alert(t('error'), t('failedToCreate'));
    }
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    handleSaveSettings({ dark_mode: value });
  };

  const handleLanguageChange = (newLang: string) => {
    setLang(newLang);
    setShowLanguagePicker(false);
    handleSaveSettings({ language: newLang });
  };

  const handleCurrencyChange = (newCurr: string) => {
    setCurr(newCurr);
    setShowCurrencyPicker(false);
    handleSaveSettings({ currency: newCurr });
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      Alert.alert(t('error'), t('enterAmount'));
      return;
    }
    try {
      await updateProfile(newName.trim());
      setEditingName(false);
    } catch (error) {
      Alert.alert(t('error'), t('failedToCreate'));
    }
  };

  const handlePickPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(t('error'), 'Permission required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setUploadingPhoto(true);
        const asset = result.assets[0];
        
        let base64Image = '';
        if (asset.base64) {
          const mimeType = asset.mimeType || 'image/jpeg';
          base64Image = `data:${mimeType};base64,${asset.base64}`;
        } else if (Platform.OS === 'web' && asset.uri) {
          // On web, convert blob URI to base64
          try {
            const response = await fetch(asset.uri);
            const blob = await response.blob();
            base64Image = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error('Web base64 conversion failed:', e);
            Alert.alert(t('error'), t('failedToCreate'));
            setUploadingPhoto(false);
            return;
          }
        }

        if (base64Image) {
          await updateProfile(user?.name || '', base64Image);
          Alert.alert(t('success'), t('photoUpdated'));
        }
        setUploadingPhoto(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      setUploadingPhoto(false);
      Alert.alert(t('error'), t('failedToCreate'));
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true);
      await updateProfile(user?.name || '', '');
      Alert.alert(t('success'), t('photoRemoved'));
    } catch (error) {
      Alert.alert(t('error'), t('failedToCreate'));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t('settings')}</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('profile')}</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={handlePickPhoto} disabled={uploadingPhoto}>
                {uploadingPhoto ? (
                  <View style={[styles.avatar, { backgroundColor: theme.backgroundLight, justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="small" color={theme.primary} />
                  </View>
                ) : user?.profile_photo ? (
                  <Image source={{ uri: user.profile_photo }} style={styles.avatar} />
                ) : (
                  <LinearGradient colors={theme.gradients.primary} style={styles.avatar}>
                    <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || '?'}</Text>
                  </LinearGradient>
                )}
                {!uploadingPhoto && (
                  <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
                    <Ionicons name="camera" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                {editingName ? (
                  <View style={styles.editNameContainer}>
                    <TextInput
                      style={[styles.nameInput, { backgroundColor: theme.backgroundLight, color: theme.text }]}
                      value={newName}
                      onChangeText={setNewName}
                      placeholder={t('name')}
                      placeholderTextColor={theme.textMuted}
                    />
                    <TouchableOpacity onPress={handleSaveName}>
                      <Ionicons name="checkmark" size={24} color={theme.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingName(false)}>
                      <Ionicons name="close" size={24} color={theme.danger} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.nameRow}
                    onPress={() => { setNewName(user?.name || ''); setEditingName(true); }}
                  >
                    <Text style={[styles.profileName, { color: theme.text }]}>{user?.name}</Text>
                    <Ionicons name="pencil" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                )}
                <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
              </View>
            </View>
            {user?.profile_photo ? (
              <View style={[styles.photoActions, { borderTopColor: theme.border }]}>
                <TouchableOpacity style={styles.photoActionBtn} onPress={handlePickPhoto}>
                  <Ionicons name="image-outline" size={18} color={theme.primary} />
                  <Text style={[styles.photoActionText, { color: theme.primary }]}>{t('changePhoto')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoActionBtn} onPress={handleRemovePhoto}>
                  <Ionicons name="trash-outline" size={18} color={theme.danger} />
                  <Text style={[styles.photoActionText, { color: theme.danger }]}>{t('removePhoto')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('appearance')}</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={[styles.settingRow, { borderBottomColor: theme.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: theme.primary + '30' }]}>
                  <Ionicons name="moon" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>{t('darkMode')}</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={darkMode ? theme.primaryLight : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{t('language')}</Text>
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <TouchableOpacity
              style={[styles.settingRow, { borderBottomColor: theme.border }]}
              onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: theme.info + '30' }]}>
                  <Ionicons name="language" size={20} color={theme.info} />
                </View>
                <Text style={[styles.settingLabel, { color: theme.text }]}>{t('language')}</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  {LANGUAGES[lang]?.flag} {LANGUAGES[lang]?.name}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </View>
            </TouchableOpacity>
            {showLanguagePicker && (
              <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundLight, borderTopColor: theme.border }]}>
                {Object.entries(LANGUAGES).map(([code, langInfo]) => (
                  <TouchableOpacity
                    key={code}
                    style={[
                      styles.pickerOption,
                      { borderBottomColor: theme.border },
                      lang === code && { backgroundColor: theme.primary + '20' },
                    ]}
                    onPress={() => handleLanguageChange(code)}
                  >
                    <Text style={[styles.pickerOptionText, { color: theme.text }]}>
                      {langInfo.flag} {langInfo.name}
                    </Text>
                    {lang === code && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <GradientButton
            title={t('logout')}
            onPress={handleLogout}
            variant="danger"
            icon={<Ionicons name="log-out-outline" size={20} color="#fff" />}
          />
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
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: {
    fontSize: 14, fontWeight: '600', marginBottom: 12,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: { borderRadius: 16, overflow: 'hidden' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  profileInfo: { marginLeft: 16, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName: { fontSize: 20, fontWeight: '600' },
  profileEmail: { fontSize: 14, marginTop: 4 },
  editNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameInput: {
    flex: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16,
  },
  photoActions: {
    flexDirection: 'row', borderTopWidth: 1, paddingVertical: 12,
    paddingHorizontal: 20, gap: 24,
  },
  photoActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  photoActionText: { fontSize: 14, fontWeight: '500' },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  settingIcon: {
    width: 40, height: 40, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  settingLabel: { fontSize: 16 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  settingValue: { fontSize: 14 },
  pickerContainer: { borderTopWidth: 1 },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1,
  },
  pickerOptionText: { fontSize: 15 },
  bottomSpacer: { height: 100 },
});
