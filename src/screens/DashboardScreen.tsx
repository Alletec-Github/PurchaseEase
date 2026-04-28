import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';
import type { PurchaseOrder } from '../types/api';

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

export default function DashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOpen: 0,
    thisMonth: 0,
    pendingReceipt: 0,
    totalAmount: 0,
  });
  const [recentOrders, setRecentOrders] = useState<PurchaseOrder[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const orders = await bcApi.getPurchaseOrders({
        $orderby: 'orderDate desc',
        $top: 50,
      });

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

      const openOrders = orders.filter(o => o.status === 'Open');
      const thisMonthOrders = orders.filter(o => o.orderDate >= monthStart);
      const pendingReceipt = orders.filter(o => o.status === 'Open' && !o.fullyReceived);
      const totalAmount = openOrders.reduce((sum, o) => sum + o.totalAmountIncludingTax, 0);

      setStats({
        totalOpen: openOrders.length,
        thisMonth: thisMonthOrders.length,
        pendingReceipt: pendingReceipt.length,
        totalAmount,
      });
      setRecentOrders(orders.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchData()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const summaryCards = [
    { title: 'Open Orders', value: stats.totalOpen.toString(), icon: 'file-document-outline', color: theme.colors.statusOpen },
    { title: 'This Month', value: stats.thisMonth.toString(), icon: 'calendar-month', color: theme.colors.warning },
    { title: 'Pending Receipt', value: stats.pendingReceipt.toString(), icon: 'truck-delivery', color: theme.colors.statusInReview },
    { title: 'Total Amount', value: formatCurrency(stats.totalAmount), icon: 'currency-usd', color: theme.colors.success },
  ];

  const quickActions = [
    { title: 'New Order', icon: 'plus-circle', color: theme.colors.primary, onPress: () => navigation.navigate('CreateOrder') },
    { title: 'Scan Doc', icon: 'camera-document', color: theme.colors.warning, onPress: () => navigation.getParent()?.navigate('CreateTab', { screen: 'ScanDocument' }) },
    { title: 'All Orders', icon: 'format-list-bulleted', color: theme.colors.statusOpen, onPress: () => navigation.getParent()?.navigate('OrdersTab') },
    { title: 'Invoices', icon: 'receipt', color: theme.colors.success, onPress: () => navigation.getParent()?.navigate('InvoicesTab') },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}>
        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          {summaryCards.map((card, i) => (
            <View key={i} style={styles.summaryCard}>
              <View style={[styles.cardIconCircle, { backgroundColor: card.color + '20' }]}>
                <Icon name={card.icon} size={22} color={card.color} />
              </View>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardTitle}>{card.title}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity key={i} style={styles.actionCard} onPress={action.onPress} activeOpacity={0.7}>
              <View style={[styles.actionIconCircle, { backgroundColor: action.color + '15' }]}>
                <Icon name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.getParent()?.navigate('OrdersTab')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="file-document-outline" size={48} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No purchase orders yet</Text>
          </View>
        ) : (
          recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              activeOpacity={0.7}>
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>{order.number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(order.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>{order.status}</Text>
                </View>
              </View>
              <Text style={styles.orderVendor}>{order.vendorName}</Text>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>{order.orderDate}</Text>
                <Text style={styles.orderAmount}>{formatCurrency(order.totalAmountIncludingTax)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: theme.colors.textSecondary, fontSize: 14 },
  errorText: { marginTop: 12, color: theme.colors.error, fontSize: 14, textAlign: 'center' },
  retryButton: { marginTop: 16, backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: theme.borderRadius.sm },
  retryText: { color: theme.colors.white, fontWeight: '600' },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  summaryCard: {
    width: '47%',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    ...theme.shadows.card,
  },
  cardIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  cardValue: { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 2 },
  cardTitle: { fontSize: 13, color: theme.colors.textSecondary },

  actionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    alignItems: 'center',
    ...theme.shadows.cardLight,
  },
  actionIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionTitle: { fontSize: 12, fontWeight: '500', color: theme.colors.text, textAlign: 'center' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 12 },
  seeAllText: { color: theme.colors.primary, fontSize: 14, fontWeight: '500' },

  orderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.cardLight,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderNumber: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderVendor: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderDate: { fontSize: 13, color: theme.colors.textLight },
  orderAmount: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },

  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { marginTop: 8, color: theme.colors.textLight, fontSize: 14 },
});
