import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';
import { appConfig } from '../config/appConfig';

const AUTH_KEY = '@PurchaseEase:isLoggedIn';
const USER_KEY = '@PurchaseEase:user';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (!password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (
      username.trim() === appConfig.demoUsername &&
      password === appConfig.demoPassword
    ) {
      await AsyncStorage.setItem(AUTH_KEY, 'true');
      await AsyncStorage.setItem(
        USER_KEY,
        JSON.stringify({
          username: username.trim(),
          displayName: 'Rishabh Shukla',
          isLoggedIn: true,
          loginTimestamp: Date.now(),
        }),
      );
      // Force reload to re-evaluate auth state in App.tsx
      const RNRestart = require('react-native');
      RNRestart.DevSettings?.reload?.();
      // Fallback: the app should re-check auth
    } else {
      Alert.alert('Login Failed', 'Invalid username or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          {/* Logo & Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoCircle}>
              <Icon name="cart-check" size={48} color={theme.colors.white} />
            </View>
            <Text style={styles.appName}>{appConfig.appName}</Text>
            <Text style={styles.tagline}>Purchase Order Management</Text>
            <Text style={styles.company}>by Alletec</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name="account" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, errors.username ? styles.inputError : null]}
                placeholder="Username"
                placeholderTextColor={theme.colors.textLight}
                value={username}
                onChangeText={(t) => { setUsername(t); setErrors(prev => ({ ...prev, username: undefined })); }}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput, errors.password ? styles.inputError : null]}
                placeholder="Password"
                placeholderTextColor={theme.colors.textLight}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors(prev => ({ ...prev, password: undefined })); }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Icon name={showPassword ? 'eye-off' : 'eye'} size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}>
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Icon name="shield-check" size={14} color={theme.colors.textLight} />
            <Text style={styles.footerText}>Secured with Microsoft Entra ID</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.white,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  company: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: 24,
    ...theme.shadows.card,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    paddingLeft: 12,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.text,
  },
  passwordInput: {
    paddingRight: 44,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
});
