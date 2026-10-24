import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@expo/vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';
import { appConfig } from '../config/appConfig';
import { useAuth } from '../services/auth';
import { bcApi } from '../services/bcApi';
import { ActionButton, SectionHeader } from '../components';
export default function SettingsScreen() {
  const {user,signOut}=useAuth();const [resetting,setResetting]=useState(false);
  const reset=()=>Alert.alert('Reset demo data?','All changes made this session will be replaced with the original sample orders and invoices.',[
    {text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:async()=>{
      setResetting(true);try{await bcApi.resetMockData();Alert.alert('Demo data restored','Refresh or return to a list to see the original data.');}
      catch(error){Alert.alert('Reset failed',error instanceof Error?error.message:'Please retry.');}finally{setResetting(false);}
    }},
  ]);
  const logout=()=>Alert.alert('Log out?','You can sign in again with your demo credentials.',[
    {text:'Cancel',style:'cancel'},{text:'Log Out',onPress:async()=>{try{await signOut();}catch{Alert.alert('Unable to log out','Please retry.');}}},
  ]);
  return <SafeAreaView edges={['left','right']} style={styles.container}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.banner}><Icon name="flask-outline" size={24} color={theme.colors.primary}/><Text style={styles.bannerText}>Running in Demo Mode — No live data connection.</Text></View>
    <View style={styles.card}><Icon name="account-circle" size={54} color={theme.colors.primary}/><Text style={styles.name}>{user?.displayName}</Text><Text>{user?.username} · Purchasing Manager</Text></View>
    <SectionHeader title="App settings"/><View style={styles.card}><Text>Environment: {appConfig.environment}</Text><Text>Version: 1.0.0 · Expo SDK 54</Text><ActionButton title="Clear cached data" icon="cached" onPress={reset} loading={resetting}/></View>
    <SectionHeader title="About PurchaseEase"/><View style={styles.card}><Text style={styles.about}>Create, track and receive purchase orders with local sample data. Demo changes last for the current app session. Document scanning is a simulation; Azure Document Intelligence integration is planned.</Text></View>
    <ActionButton title="Log Out" icon="logout" variant="danger" onPress={logout}/>
    <Text style={styles.footer}>PurchaseEase · Purchase order management community</Text>
  </ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:theme.colors.background},content:{padding:16,gap:16},banner:{padding:16,backgroundColor:theme.colors.primaryLight,borderRadius:12,flexDirection:'row',gap:12},bannerText:{flex:1,color:theme.colors.primary,lineHeight:21},card:{padding:16,backgroundColor:'white',borderRadius:12,gap:12,...theme.shadows.cardLight},name:{fontSize:22,fontWeight:'700',color:theme.colors.text},about:{lineHeight:23,color:theme.colors.textSecondary},footer:{textAlign:'center',color:theme.colors.textSecondary,fontSize:12}});
