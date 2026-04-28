import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';
import type { PurchaseOrder } from '../types/api';
import type { OrderFilterTab } from '../types/app';

const formatCurrency = (amount: number) =>
  '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Draft': return theme.colors.statusDraft;
    case 'Open': return theme.colors.statusOpen;
    case 'In Review': return theme.colors.statusInReview;
    default: return theme.colors.statusReceived;
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'Draft': return theme.colors.statusDraftBg;
    case 'Open': return theme.colors.statusOpenBg;
    case 'In Review': return theme.colors.statusInReviewBg;
    default: return theme.colors.statusReceivedBg;
  }
};

const TABS: OrderFilterTab[] = ['All', 'Draft', 'Open', 'Received'];

export default function OrderListScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OrderFilterTab>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const data = await bcApi.getPurchaseOrders({ $orderby: 'orderDate desc' });
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'All' ||
      (activeTab === 'Received' ? o.fullyReceived : o.status === activeTab);
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      o.number.toLowerCase().includes(q) ||
      o.vendorName.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  const renderOrder = ({ item: order }: { item: PurchaseOrder }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
      activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{order.number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
            {order.fullyReceived ? 'Received' : order.status}
          </Text>
        </View>
      </View>
      <Text style={styles.orderVendor}>{order.vendorName}</Text>
      <View style={styles.orderFooter}>
        <View style={styles.dateRow}>
          <Icon name="calendar" size={14} color={theme.colors.textLight} />
          <Text style={styles.orderDate}>{order.orderDate}</Text>
        </View>
        <Text style={styles.orderAmount}>{formatCurrency(order.totalAmountIncludingTax)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by order # or vendor..."
          placeholderTextColor={theme.colors.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={18} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.centered}>
          <Icon name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchOrders()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={o => o.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(true); }} tintColor={theme.colors.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="file-document-outline" size={56} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'Create your first purchase order'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, margin: theme.spacing.lg, marginBottom: 0, borderRadius: theme.borderRadius.sm, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, height: 44, marginLeft: 8, fontSize: 15, color: theme.colors.text },

  tabBar: { flexDirection: 'row', paddingHorizontal: theme.spacing.lg, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border },
  tabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: theme.colors.textSecondary },
  tabTextActive: { color: theme.colors.white },

  listContent: { paddingHorizontal: theme.spacing.lg, paddingBottom: 24 },
  orderCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 10, ...theme.shadows.cardLight },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderVendor: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  orderDate: { fontSize: 13, color: theme.colors.textLight },
  orderAmount: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },

  errorText: { marginTop: 12, color: theme.colors.error, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: theme.borderRadius.sm },
  retryText: { color: theme.colors.white, fontWeight: '600' },

  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: theme.colors.textLight, marginTop: 4 },
});
