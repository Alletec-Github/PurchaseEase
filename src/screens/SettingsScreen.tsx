import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../services/auth';
import { bcApi } from '../services/bcApi';
import { ActionButton, SectionHeader } from '../components';
export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [error, setError] = useState('');
  const check = useCallback(async () => {
    setStatus('checking'); setError('');
    try { await bcApi.testConnection(); setStatus('connected'); }
    catch (error) { setStatus('failed'); setError(error instanceof Error ? error.message : 'Unable to connect'); }
  }, []);
  useFocusEffect(useCallback(() => { void check(); }, [check]));
  const clear = () => { bcApi.clearCache(); void check(); Alert.alert('Cache cleared', 'The in-memory access token was cleared. Business Central records are unchanged.'); };
  const logout = () => Alert.alert('Log out?', 'You can sign in again with your demo credentials.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Log Out', onPress: async () => { try { await signOut(); } catch { Alert.alert('Unable to log out', 'Please retry.'); } } },
  ]);
  return <SafeAreaView edges={['left', 'right']} style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.card}><Icon name="account-circle" size={54} color={theme.colors.primary}/><Text style={styles.name}>{user?.displayName}</Text><Text>{user?.username} · Purchasing Manager</Text></View>
    <SectionHeader title="Business Central connection"/>
    <View style={styles.card}><Text style={{ color: status === 'connected' ? theme.colors.success : status === 'failed' ? theme.colors.error : theme.colors.textSecondary }}>● {status === 'connected' ? 'Connected to Business Central' : status === 'checking' ? 'Checking connection…' : 'Connection failed'}</Text>
      <Text>Environment: {appConfig.environment}</Text>{!!error && <Text style={{color:theme.colors.error}}>{error}</Text>}
      <ActionButton title="Test connection" icon="connection" onPress={check} loading={status === 'checking'}/></View>
    <SectionHeader title="App settings"/><View style={styles.card}><Text>Version: 1.0.0 · Expo SDK 54</Text><ActionButton title="Clear cached data" icon="cached" onPress={clear}/></View>
    <SectionHeader title="About PurchaseEase"/><View style={styles.card}><Text style={styles.about}>Create, track and receive purchase orders in Microsoft Business Central using its standard v2.0 APIs. Document scanning is a simulation; Azure Document Intelligence integration is planned.</Text></View>
    <ActionButton title="Log Out" icon="logout" variant="danger" onPress={logout}/>
    <Text style={styles.footer}>PurchaseEase · Purchase order management community</Text>
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:theme.colors.background},content:{padding:16,gap:16},card:{padding:16,backgroundColor:'white',borderRadius:12,gap:12,...theme.shadows.cardLight},name:{fontSize:22,fontWeight:'700',color:theme.colors.text},about:{lineHeight:23,color:theme.colors.textSecondary},footer:{textAlign:'center',color:theme.colors.textSecondary,fontSize:12}});
