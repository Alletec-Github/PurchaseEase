import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';
import type { PurchaseInvoice } from '../types/api';

const formatCurrency = (amount: number) =>
  '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function InvoiceDetailScreen() {
  const route = useRoute<any>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<PurchaseInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bcApi.getPurchaseInvoices({ $filter: `id eq ${invoiceId}` })
      .then(data => { if (data.length > 0) setInvoice(data[0]); })
      .catch((err: any) => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  if (!invoice) {
    return (
      <View style={styles.centered}>
        <Icon name="alert-circle" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>Invoice not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <Text style={styles.invoiceNumber}>{invoice.number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.statusReceivedBg }]}>
              <Text style={[styles.statusText, { color: theme.colors.statusReceived }]}>Posted</Text>
            </View>
          </View>

          <View style={styles.vendorSection}>
            <Icon name="store" size={20} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.vendorName}>{invoice.vendorName}</Text>
              <Text style={styles.vendorDetail}>{invoice.vendorNumber}</Text>
              {invoice.buyFromAddressLine1 ? (
                <Text style={styles.vendorAddress}>
                  {invoice.buyFromAddressLine1}{invoice.buyFromCity ? `, ${invoice.buyFromCity}` : ''}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.datesRow}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Invoice Date</Text>
              <Text style={styles.dateValue}>{invoice.invoiceDate}</Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Posting Date</Text>
              <Text style={styles.dateValue}>{invoice.postingDate}</Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Due Date</Text>
                <Text style={styles.dateValue}>{invoice.dueDate}</Text>
              </View>
            )}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalAmountExcludingTax)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.totalTaxAmount)}</Text>
            </View>
            {invoice.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={[styles.totalValue, { color: theme.colors.success }]}>-{formatCurrency(invoice.discountAmount)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(invoice.totalAmountIncludingTax)}</Text>
            </View>
          </View>
        </View>

        {invoice.paymentTermsId && (
          <View style={styles.infoCard}>
            <Icon name="credit-card-clock" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>Payment Terms ID: {invoice.paymentTermsId}</Text>
          </View>
        )}

        {invoice.shipToName && (
          <View style={styles.infoCard}>
            <Icon name="truck-delivery" size={20} color={theme.colors.textSecondary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.infoText}>Ship To: {invoice.shipToName}</Text>
              {invoice.shipToAddressLine1 && <Text style={styles.infoSubtext}>{invoice.shipToAddressLine1}{invoice.shipToCity ? `, ${invoice.shipToCity}` : ''}</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { marginTop: 12, color: theme.colors.error },
  scrollContent: { padding: theme.spacing.lg },

  headerCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16, ...theme.shadows.card },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  invoiceNumber: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },

  vendorSection: { flexDirection: 'row', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight, marginBottom: 14 },
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

  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 14, marginBottom: 8, ...theme.shadows.cardLight },
  infoText: { fontSize: 14, color: theme.colors.text, marginLeft: 10 },
  infoSubtext: { fontSize: 12, color: theme.colors.textLight, marginTop: 2 },
});
