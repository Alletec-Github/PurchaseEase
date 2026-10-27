import React, {useState, useCallback} from 'react';
import {View,Text,ScrollView,ActivityIndicator,StyleSheet,RefreshControl} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute,useFocusEffect,RouteProp} from '@react-navigation/native';
import type {InvoicesStackParamList} from '../types/navigation';
import type {PurchaseInvoice} from '../types/api';
import {bcApi} from '../services/bcApi';
import {StatusBadge,CurrencyDisplay} from '../components';
import ErrorState from '../components/ErrorState';
import {theme} from '../config/theme';
export default function InvoiceDetailScreen(){
  const {params:{invoiceId}}=useRoute<RouteProp<InvoicesStackParamList,'InvoiceDetail'>>();
  const [invoice,setInvoice]=useState<PurchaseInvoice|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{setLoading(true);setError(null);try{const data=await bcApi.getPurchaseInvoice(invoiceId);setInvoice(data);}catch(e){setError(e instanceof Error?e.message:'Unable to load invoice');}finally{setLoading(false);}},[invoiceId]);
  useFocusEffect(useCallback(()=>{load();},[load]));
  if(error)return <ErrorState message={error} onRetry={load}/>;
  if(!invoice)return <View style={styles.loading}><ActivityIndicator color={theme.colors.primary}/></View>;
  return <SafeAreaView edges={['left','right']} style={styles.container}><ScrollView contentContainerStyle={{padding:16}} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/>}>
    <View style={styles.card}><Text style={styles.title}>{invoice.number}</Text><StatusBadge status={invoice.status}/><Text style={styles.title}>{invoice.vendorName}</Text>
      {Object.entries(invoice).filter(([key])=>key!=='totalAmountExcludingTax'&&key!=='totalAmountIncludingTax').map(([key,value])=><View key={key} style={styles.row}><Text style={styles.label}>{key.replace(/([A-Z])/g,' $1')}</Text><Text selectable style={styles.value}>{String(value)}</Text></View>)}
      <View style={styles.row}><Text>Subtotal</Text><CurrencyDisplay currencyCode={invoice.currencyCode} amount={invoice.totalAmountExcludingTax}/></View>
      <View style={styles.row}><Text>Tax</Text><CurrencyDisplay currencyCode={invoice.currencyCode} amount={invoice.totalAmountIncludingTax-invoice.totalAmountExcludingTax}/></View>
      <View style={styles.row}><Text style={styles.title}>Total</Text><CurrencyDisplay currencyCode={invoice.currencyCode} amount={invoice.totalAmountIncludingTax}/></View>
    </View></ScrollView></SafeAreaView>;
}
const styles=StyleSheet.create({container:{flex:1,backgroundColor:theme.colors.background},loading:{flex:1,alignItems:'center',justifyContent:'center'},card:{padding:16,borderRadius:12,backgroundColor:'white',gap:16,...theme.shadows.card},title:{fontSize:20,fontWeight:'600',color:theme.colors.text},row:{flexDirection:'row',justifyContent:'space-between',gap:16},label:{flex:1,textTransform:'capitalize',color:theme.colors.textSecondary},value:{flex:1,textAlign:'right'}});
