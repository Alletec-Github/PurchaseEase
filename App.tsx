import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/services/auth';
import { theme } from './src/config/theme';
function Session() {
  const {user,loading}=useAuth();
  if(loading)return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.primary}/><Text>Loading PurchaseEase…</Text></View>;
  return <AppNavigator isLoggedIn={!!user}/>;
}
export default function App() {
  return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><AuthProvider><StatusBar style="light"/><Session/></AuthProvider></SafeAreaProvider></GestureHandlerRootView>;
}
const styles=StyleSheet.create({root:{flex:1},loading:{flex:1,alignItems:'center',justifyContent:'center',gap:16}});
