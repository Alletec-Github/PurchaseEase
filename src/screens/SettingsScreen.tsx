import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';

const APP_VERSION = '1.0.0';

interface SettingRowProps {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingRow({ icon, iconColor, title, subtitle, onPress, rightElement, danger }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.6 : 1}>
      <View style={[styles.iconContainer, { backgroundColor: danger ? '#FFF0F0' : theme.colors.primaryLight }]}>
        <Icon name={icon} size={20} color={iconColor || (danger ? theme.colors.error : theme.colors.primary)} />
      </View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowTitle, danger && { color: theme.colors.error }]}>{title}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
      </View>
      {rightElement || (onPress && <Icon name="chevron-right" size={20} color={theme.colors.textLight} />)}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await bcApi.testConnection();
      Alert.alert(
        result.success ? 'Connected' : 'Connection Failed',
        result.success
          ? `Successfully connected to Business Central.\n${result.companiesCount || 0} companies found.`
          : result.error || 'Unable to connect',
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will clear cached data. You may need to refresh screens.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: async () => {
          try {
            const keys = await AsyncStorage.getAllKeys();
            const cacheKeys = keys.filter(k => k.startsWith('cache_'));
            await AsyncStorage.multiRemove(cacheKeys);
            Alert.alert('Done', `Cleared ${cacheKeys.length} cached items`);
          } catch {
            Alert.alert('Error', 'Failed to clear cache');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('isLoggedIn');
          await AsyncStorage.removeItem('userProfile');
          // Reset to login - parent App.tsx watches this
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name="account" size={32} color={theme.colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>Demo User</Text>
            <Text style={styles.profileEmail}>admin@alletec.com</Text>
            <Text style={styles.profileRole}>Purchasing Manager</Text>
          </View>
        </View>

        {/* API Connection */}
        <Text style={styles.sectionTitle}>Business Central</Text>
        <View style={styles.section}>
          <SettingRow
            icon="cloud-check"
            title="Test API Connection"
            subtitle="Verify Business Central connectivity"
            onPress={handleTestConnection}
            rightElement={testing ? <ActivityIndicator size="small" color={theme.colors.primary} /> : undefined}
          />
          <SettingRow
            icon="domain"
            title="Environment"
            subtitle="Production"
          />
        </View>

        {/* App Settings */}
        <Text style={styles.sectionTitle}>App</Text>
        <View style={styles.section}>
          <SettingRow
            icon="cached"
            title="Clear Cache"
            subtitle="Remove cached API data"
            onPress={handleClearCache}
          />
          <SettingRow
            icon="information"
            title="Version"
            subtitle={APP_VERSION}
          />
          <SettingRow
            icon="shield-check"
            title="Privacy Policy"
            subtitle="View privacy information"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be available at launch.')}
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <SettingRow
            icon="logout"
            title="Log Out"
            onPress={handleLogout}
            danger
          />
        </View>

        <Text style={styles.footer}>PurchaseEase v{APP_VERSION}{'\n'}© 2026 Alletec</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg },

  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 20, gap: 14, ...theme.shadows.card },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: '600', color: theme.colors.text },
  profileEmail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  profileRole: { fontSize: 12, color: theme.colors.primary, marginTop: 2 },

  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  section: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, marginBottom: 20, overflow: 'hidden', ...theme.shadows.cardLight },

  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  iconContainer: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  rowSubtitle: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },

  footer: { textAlign: 'center', fontSize: 12, color: theme.colors.textLight, marginTop: 8, lineHeight: 18 },
});
