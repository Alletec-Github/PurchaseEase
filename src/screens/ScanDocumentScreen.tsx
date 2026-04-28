import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../config/theme';

const formatCurrency = (amount: number) =>
  '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const MOCK_RESULT = {
  vendorName: 'Contoso Electronics Ltd.',
  invoiceNumber: 'INV-2026-00847',
  invoiceDate: '2026-04-25',
  lineItems: [
    { description: 'Wireless Keyboard Pro', quantity: 10, unitCost: 45.99, amount: 459.90 },
    { description: 'USB-C Docking Station', quantity: 5, unitCost: 129.99, amount: 649.95 },
    { description: 'Monitor Stand Adjustable', quantity: 8, unitCost: 34.50, amount: 276.00 },
  ],
  subtotal: 1385.85,
  taxAmount: 138.59,
  totalAmount: 1524.44,
  confidence: 0.94,
};

export default function ScanDocumentScreen() {
  const navigation = useNavigation<any>();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (scanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      );
      pulse.start();
      const timer = setTimeout(() => {
        pulse.stop();
        setScanning(false);
        setScanned(true);
      }, 3000);
      return () => { pulse.stop(); clearTimeout(timer); };
    }
  }, [scanning, pulseAnim]);

  const handleScan = () => {
    setScanned(false);
    setScanning(true);
  };

  const handleCreateFromScan = () => {
    navigation.navigate('CreateOrder', {
      prefillData: {
        lines: MOCK_RESULT.lineItems.map((item, i) => ({
          tempId: `scan-${i}`,
          item: {
            id: `mock-${i}`,
            number: `SCAN-${i + 1}`,
            displayName: item.description,
            type: 'Inventory' as const,
            unitPrice: item.unitCost,
            unitCost: item.unitCost,
            inventory: 0,
            baseUnitOfMeasureCode: 'PCS',
            blocked: false,
            itemCategoryCode: '',
          },
          quantity: item.quantity,
          directUnitCost: item.unitCost,
          discountPercent: 0,
          lineType: 'Item' as const,
          description: item.description,
          unitOfMeasureCode: 'PCS',
        })),
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Icon name="robot" size={28} color={theme.colors.warning} />
          </View>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>AI Document Extraction — Coming Soon</Text>
            <Text style={styles.bannerText}>
              Azure Document Intelligence will extract vendor details, line items, and amounts from purchase invoices automatically.
            </Text>
          </View>
        </View>

        {/* Scan Area */}
        {!scanned && (
          <View style={styles.scanArea}>
            {scanning ? (
              <View style={styles.scanningContainer}>
                <Animated.View style={[styles.scanningCircle, { transform: [{ scale: pulseAnim }] }]}>
                  <Icon name="file-search" size={48} color={theme.colors.primary} />
                </Animated.View>
                <ActivityIndicator style={{ marginTop: 16 }} color={theme.colors.primary} />
                <Text style={styles.scanningText}>Analyzing document...</Text>
                <Text style={styles.scanningSubtext}>Extracting vendor, items, and amounts</Text>
              </View>
            ) : (
              <>
                <View style={styles.uploadArea}>
                  <Icon name="camera-document" size={64} color={theme.colors.textLight} />
                  <Text style={styles.uploadTitle}>Scan or Upload Document</Text>
                  <Text style={styles.uploadSubtitle}>Take a photo or select a file</Text>
                </View>
                <View style={styles.buttonRow}>
                  <TouchableOpacity style={styles.scanButton} onPress={handleScan} activeOpacity={0.7}>
                    <Icon name="camera" size={22} color={theme.colors.white} />
                    <Text style={styles.scanButtonText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.fileButton} onPress={handleScan} activeOpacity={0.7}>
                    <Icon name="file-upload" size={22} color={theme.colors.primary} />
                    <Text style={styles.fileButtonText}>Upload File</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        )}

        {/* Mock Result */}
        {scanned && (
          <>
            <View style={styles.resultHeader}>
              <Icon name="check-circle" size={24} color={theme.colors.success} />
              <Text style={styles.resultTitle}>Document Analyzed</Text>
              <Text style={styles.confidenceText}>{Math.round(MOCK_RESULT.confidence * 100)}% confidence</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.cardTitle}>Extracted Data</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Vendor</Text>
                <Text style={styles.resultValue}>{MOCK_RESULT.vendorName}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Invoice #</Text>
                <Text style={styles.resultValue}>{MOCK_RESULT.invoiceNumber}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Date</Text>
                <Text style={styles.resultValue}>{MOCK_RESULT.invoiceDate}</Text>
              </View>

              <Text style={[styles.cardTitle, { marginTop: 16 }]}>Line Items</Text>
              {MOCK_RESULT.lineItems.map((item, i) => (
                <View key={i} style={styles.lineItem}>
                  <Text style={styles.lineName}>{item.description}</Text>
                  <View style={styles.lineDetails}>
                    <Text style={styles.lineQty}>{item.quantity} x {formatCurrency(item.unitCost)}</Text>
                    <Text style={styles.lineAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.totalSection}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>{formatCurrency(MOCK_RESULT.subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tax</Text>
                  <Text style={styles.totalValue}>{formatCurrency(MOCK_RESULT.taxAmount)}</Text>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <Text style={styles.grandTotalLabel}>Total</Text>
                  <Text style={styles.grandTotalValue}>{formatCurrency(MOCK_RESULT.totalAmount)}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateFromScan} activeOpacity={0.7}>
              <Icon name="file-plus" size={22} color={theme.colors.white} />
              <Text style={styles.createButtonText}>Create Order from Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rescanButton} onPress={handleScan}>
              <Icon name="refresh" size={20} color={theme.colors.primary} />
              <Text style={styles.rescanText}>Scan Another Document</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing.lg },

  banner: { flexDirection: 'row', backgroundColor: '#FFF8E1', borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FFE082' },
  bannerIcon: { marginRight: 12, marginTop: 2 },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '600', color: '#F57C00', marginBottom: 4 },
  bannerText: { fontSize: 13, color: '#795548', lineHeight: 18 },

  scanArea: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 24, marginBottom: 16, ...theme.shadows.card },
  uploadArea: { alignItems: 'center', paddingVertical: 32, borderWidth: 2, borderColor: theme.colors.border, borderStyle: 'dashed', borderRadius: theme.borderRadius.md, marginBottom: 20 },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: theme.colors.text, marginTop: 12 },
  uploadSubtitle: { fontSize: 14, color: theme.colors.textLight, marginTop: 4 },

  buttonRow: { flexDirection: 'row', gap: 12 },
  scanButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: theme.borderRadius.sm, gap: 8 },
  scanButtonText: { color: theme.colors.white, fontSize: 15, fontWeight: '600' },
  fileButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white, paddingVertical: 14, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.primary, gap: 8 },
  fileButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },

  scanningContainer: { alignItems: 'center', paddingVertical: 24 },
  scanningCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  scanningText: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 12 },
  scanningSubtext: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4 },

  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.success, flex: 1 },
  confidenceText: { fontSize: 13, color: theme.colors.textSecondary, backgroundColor: theme.colors.statusReceivedBg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },

  resultCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16, ...theme.shadows.card },
  cardTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  resultLabel: { fontSize: 14, color: theme.colors.textSecondary },
  resultValue: { fontSize: 14, fontWeight: '500', color: theme.colors.text },

  lineItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  lineName: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  lineDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  lineQty: { fontSize: 13, color: theme.colors.textSecondary },
  lineAmount: { fontSize: 14, fontWeight: '600', color: theme.colors.text },

  totalSection: { marginTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { fontSize: 14, color: theme.colors.textSecondary },
  totalValue: { fontSize: 14, color: theme.colors.text },
  grandTotalRow: { borderTopWidth: 2, borderTopColor: theme.colors.primary, marginTop: 4, paddingTop: 8 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  grandTotalValue: { fontSize: 17, fontWeight: '700', color: theme.colors.primary },

  createButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.success, paddingVertical: 14, borderRadius: theme.borderRadius.sm, gap: 8, marginBottom: 12 },
  createButtonText: { color: theme.colors.white, fontSize: 16, fontWeight: '600' },
  rescanButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
  rescanText: { color: theme.colors.primary, fontSize: 14, fontWeight: '500' },
});
