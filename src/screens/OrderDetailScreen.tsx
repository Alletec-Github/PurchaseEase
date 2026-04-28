import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';
import type { PurchaseOrder, PurchaseOrderLine } from '../types/api';

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

export default function OrderDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const [orderData, linesData] = await Promise.all([
        bcApi.getPurchaseOrder(orderId),
        bcApi.getPurchaseOrderLines(orderId),
      ]);
      setOrder(orderData);
      setLines(linesData);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load order');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const handleDelete = () => {
    Alert.alert('Delete Order', 'Are you sure you want to delete this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await bcApi.deletePurchaseOrder(orderId);
            Alert.alert('Deleted', 'Order has been deleted');
            navigation.goBack();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to delete order');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await bcApi.updatePurchaseOrder(orderId, { status: 'Open' });
      fetchData();
      Alert.alert('Success', 'Order submitted and set to Open');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceiveAndInvoice = async () => {
    Alert.alert('Receive & Invoice', 'This will receive and invoice the order. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          try {
            await bcApi.receiveAndInvoice(orderId);
            Alert.alert('Success', 'Order received and invoiced');
            fetchData();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to receive and invoice');
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  const isReceived = order.fullyReceived;
  const displayStatus = isReceived ? 'Received' : order.status;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(true); }} tintColor={theme.colors.primary} />}>

        {/* Status & Number Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.orderNumber}>{order.number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusBg(displayStatus) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(displayStatus) }]}>{displayStatus}</Text>
            </View>
          </View>

          {/* Vendor Info */}
          <View style={styles.vendorSection}>
            <Icon name="store" size={20} color={theme.colors.primary} />
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorName}>{order.vendorName}</Text>
              <Text style={styles.vendorDetail}>{order.vendorNumber}</Text>
              {order.buyFromAddressLine1 ? (
                <Text style={styles.vendorAddress}>
                  {order.buyFromAddressLine1}{order.buyFromCity ? `, ${order.buyFromCity}` : ''}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Order Date</Text>
              <Text style={styles.dateValue}>{order.orderDate}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Posting Date</Text>
              <Text style={styles.dateValue}>{order.postingDate}</Text>
            </View>
            {order.requestedReceiptDate ? (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Receipt Date</Text>
                <Text style={styles.dateValue}>{order.requestedReceiptDate}</Text>
              </View>
            ) : null}
          </View>

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalAmountExcludingTax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(order.totalTaxAmount)}</Text>
            </View>
            {order.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: theme.colors.success }]}>-{formatCurrency(order.discountAmount)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(order.totalAmountIncludingTax)}</Text>
            </View>
          </View>
        </View>

        {/* Line Items */}
        <Text style={styles.sectionTitle}>Line Items ({lines.length})</Text>
        {lines.map((line) => (
          <View key={line.id} style={styles.lineCard}>
            <View style={styles.lineHeader}>
              <Text style={styles.lineDescription} numberOfLines={2}>{line.description}</Text>
              <Text style={styles.lineAmount}>{formatCurrency(line.amountIncludingTax)}</Text>
            </View>
            <View style={styles.lineDetails}>
              <Text style={styles.lineDetail}>{line.lineObjectNumber}</Text>
              <Text style={styles.lineDetail}>
                {line.quantity} x {formatCurrency(line.directUnitCost)}
              </Text>
              {line.discountPercent > 0 && (
                <Text style={[styles.lineDetail, { color: theme.colors.success }]}>-{line.discountPercent}% disc</Text>
              )}
            </View>
            {(line.receivedQuantity > 0 || line.invoicedQuantity > 0) && (
              <View style={styles.lineReceived}>
                <Text style={styles.lineReceivedText}>Received: {line.receivedQuantity} | Invoiced: {line.invoicedQuantity}</Text>
              </View>
            )}
          </View>
        ))}

        {lines.length === 0 && (
          <View style={styles.emptyLines}>
            <Icon name="package-variant" size={40} color={theme.colors.textLight} />
            <Text style={styles.emptyText}>No line items</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      {!isReceived && (
        <View style={styles.actionBar}>
          {actionLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <>
              {order.status === 'Draft' && (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditOrder', { orderId })}>
                    <Icon name="pencil" size={20} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                    <Icon name="delete" size={20} color={theme.colors.error} />
                    <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.submitBtn]} onPress={handleSubmit}>
                    <Icon name="send" size={20} color={theme.colors.white} />
                    <Text style={[styles.actionText, { color: theme.colors.white }]}>Submit</Text>
                  </TouchableOpacity>
                </>
              )}
              {order.status === 'Open' && (
                <>
                  <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditOrder', { orderId })}>
                    <Icon name="pencil" size={20} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.receiveBtn]} onPress={handleReceiveAndInvoice}>
                    <Icon name="check-all" size={20} color={theme.colors.white} />
                    <Text style={[styles.actionText, { color: theme.colors.white }]}>Receive & Invoice</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  errorText: { marginTop: 12, color: theme.colors.error },

  headerCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16, ...theme.shadows.card },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  orderNumber: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },

  vendorSection: { flexDirection: 'row', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, marginBottom: 14, gap: 10 },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  vendorDetail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  vendorAddress: { fontSize: 13, color: theme.colors.textLight, marginTop: 2 },

  datesRow: { flexDirection: 'row', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  dateItem: { flex: 1 },
  dateLabel: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 2 },
  dateValue: { fontSize: 14, fontWeight: '500', color: theme.colors.text },

  totalsSection: {},
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: theme.colors.textSecondary },
  totalValue: { fontSize: 14, color: theme.colors.text },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: theme.colors.primary, marginTop: 6, paddingTop: 8 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  grandTotalValue: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },

  sectionTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  lineCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 14, marginBottom: 8, ...theme.shadows.cardLight },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lineDescription: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.text, marginRight: 8 },
  lineAmount: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  lineDetails: { flexDirection: 'row', gap: 12 },
  lineDetail: { fontSize: 12, color: theme.colors.textSecondary },
  lineReceived: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.borderLight },
  lineReceivedText: { fontSize: 12, color: theme.colors.success },

  emptyLines: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { marginTop: 8, color: theme.colors.textLight },

  actionBar: { flexDirection: 'row', padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.white, justifyContent: 'center' },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.primary, gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
  deleteButton: { borderColor: theme.colors.error },
  submitBtn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  receiveBtn: { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
});
