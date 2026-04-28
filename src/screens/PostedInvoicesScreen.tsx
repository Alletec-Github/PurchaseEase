import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';
import type { PurchaseInvoice } from '../types/api';

const formatCurrency = (amount: number) =>
  '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function PostedInvoicesScreen() {
  const navigation = useNavigation<any>();
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await bcApi.getPurchaseInvoices({ $orderby: 'invoiceDate desc', $top: '100' });
      setInvoices(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchInvoices(); }, [fetchInvoices]));

  const filtered = invoices.filter(inv =>
    inv.number.toLowerCase().includes(search.toLowerCase()) ||
    inv.vendorName.toLowerCase().includes(search.toLowerCase()),
  );

  const renderItem = ({ item }: { item: PurchaseInvoice }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })} activeOpacity={0.7}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.invoiceNumber}>{item.number}</Text>
          <Text style={styles.vendorName}>{item.vendorName}</Text>
        </View>
        <Text style={styles.amount}>{formatCurrency(item.totalAmountIncludingTax)}</Text>
      </View>
      <View style={styles.cardBottom}>
        <View style={styles.dateRow}>
          <Icon name="calendar" size={14} color={theme.colors.textLight} />
          <Text style={styles.dateText}>{item.invoiceDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.statusReceivedBg }]}>
          <Text style={[styles.statusText, { color: theme.colors.statusReceived }]}>Posted</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search invoices..."
          placeholderTextColor={theme.colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Icon name="close-circle" size={18} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(true); }} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="file-document-outline" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyText}>{search ? 'No matching invoices' : 'No posted invoices'}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: theme.spacing.lg, marginBottom: 0, backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, height: 42, marginLeft: 8, fontSize: 14, color: theme.colors.text },
  list: { padding: theme.spacing.lg },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 10, ...theme.shadows.cardLight },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  invoiceNumber: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  vendorName: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 12, color: theme.colors.textLight },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { marginTop: 12, color: theme.colors.textLight, fontSize: 15 },
});
