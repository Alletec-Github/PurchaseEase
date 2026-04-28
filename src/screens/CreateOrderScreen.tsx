import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../config/theme';
import { bcApi } from '../services/bcApi';
import type { Vendor, Item } from '../types/api';
import type { DraftOrderLine } from '../types/app';

const formatCurrency = (amount: number) =>
  '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const STEPS = ['Select Vendor', 'Add Items', 'Details', 'Review'];

export default function CreateOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefillData = route.params?.prefillData;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Vendor
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(prefillData?.vendor || null);
  const [vendorsLoading, setVendorsLoading] = useState(true);

  // Step 2: Items
  const [items, setItems] = useState<Item[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [orderLines, setOrderLines] = useState<DraftOrderLine[]>(prefillData?.lines || []);
  const [itemsLoading, setItemsLoading] = useState(true);

  // Step 3: Details
  const [orderDate, setOrderDate] = useState(new Date());
  const [receiptDate, setReceiptDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'order' | 'receipt' | null>(null);

  useEffect(() => {
    bcApi.getVendors({ $orderby: 'displayName' }).then(setVendors).catch(() => {}).finally(() => setVendorsLoading(false));
    bcApi.getItems({ $orderby: 'displayName' }).then(setItems).catch(() => {}).finally(() => setItemsLoading(false));
  }, []);

  const filteredVendors = vendors.filter(v =>
    v.displayName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
    v.number.toLowerCase().includes(vendorSearch.toLowerCase()),
  );

  const filteredItems = items.filter(i =>
    !i.blocked &&
    (i.displayName.toLowerCase().includes(itemSearch.toLowerCase()) ||
     i.number.toLowerCase().includes(itemSearch.toLowerCase())),
  );

  const addItemLine = (item: Item) => {
    const exists = orderLines.find(l => l.item.id === item.id);
    if (exists) {
      setOrderLines(prev => prev.map(l => l.item.id === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      return;
    }
    setOrderLines(prev => [...prev, {
      tempId: Date.now().toString(),
      item,
      quantity: 1,
      directUnitCost: item.unitCost,
      discountPercent: 0,
      lineType: 'Item',
      description: item.displayName,
      unitOfMeasureCode: item.baseUnitOfMeasureCode,
    }]);
  };

  const updateLine = (tempId: string, updates: Partial<DraftOrderLine>) => {
    setOrderLines(prev => prev.map(l => l.tempId === tempId ? { ...l, ...updates } : l));
  };

  const removeLine = (tempId: string) => {
    setOrderLines(prev => prev.filter(l => l.tempId !== tempId));
  };

  const lineTotal = (line: DraftOrderLine) => {
    const subtotal = line.quantity * line.directUnitCost;
    return subtotal - (subtotal * line.discountPercent / 100);
  };

  const grandTotal = orderLines.reduce((sum, l) => sum + lineTotal(l), 0);

  const canProceed = () => {
    switch (step) {
      case 0: return !!selectedVendor;
      case 1: return orderLines.length > 0;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedVendor) return;
    setSubmitting(true);
    try {
      const order = await bcApi.createPurchaseOrder({
        vendorId: selectedVendor.id,
        orderDate: orderDate.toISOString().split('T')[0],
        requestedReceiptDate: receiptDate?.toISOString().split('T')[0] || '',
      });

      for (const line of orderLines) {
        await bcApi.createPurchaseOrderLine(order.id, {
          lineType: line.lineType,
          lineObjectNumber: line.item.number,
          quantity: line.quantity,
          directUnitCost: line.directUnitCost,
          discountPercent: line.discountPercent,
          description: line.description,
          unitOfMeasureCode: line.unitOfMeasureCode,
        });
      }

      Alert.alert('Success', `Purchase Order ${order.number} created successfully!`, [
        { text: 'View Order', onPress: () => navigation.navigate('OrderDetail', { orderId: order.id }) },
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  // Step indicator
  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {STEPS.map((s, i) => (
        <View key={i} style={styles.stepItem}>
          <View style={[styles.stepCircle, i <= step ? styles.stepCircleActive : null]}>
            {i < step ? (
              <Icon name="check" size={14} color={theme.colors.white} />
            ) : (
              <Text style={[styles.stepNumber, i <= step ? styles.stepNumberActive : null]}>{i + 1}</Text>
            )}
          </View>
          <Text style={[styles.stepLabel, i <= step ? styles.stepLabelActive : null]}>{s}</Text>
        </View>
      ))}
    </View>
  );

  // Step 1: Vendor Selection
  const renderVendorStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
          placeholderTextColor={theme.colors.textLight}
          value={vendorSearch}
          onChangeText={setVendorSearch}
        />
      </View>
      {vendorsLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} color={theme.colors.primary} />
      ) : (
        <FlatList
          data={filteredVendors}
          keyExtractor={v => v.id}
          renderItem={({ item: v }) => (
            <TouchableOpacity
              style={[styles.vendorCard, selectedVendor?.id === v.id && styles.vendorCardSelected]}
              onPress={() => setSelectedVendor(v)}>
              <View style={styles.vendorInfo}>
                <Text style={styles.vendorName}>{v.displayName}</Text>
                <Text style={styles.vendorDetail}>{v.number} · {v.city}</Text>
              </View>
              {selectedVendor?.id === v.id && (
                <Icon name="check-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No vendors found</Text>}
        />
      )}
    </View>
  );

  // Step 2: Line Items
  const renderItemsStep = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor={theme.colors.textLight}
          value={itemSearch}
          onChangeText={setItemSearch}
        />
      </View>

      {/* Available Items */}
      {itemsLoading ? (
        <ActivityIndicator style={{ marginTop: 16 }} color={theme.colors.primary} />
      ) : (
        <View style={styles.itemsGrid}>
          {filteredItems.slice(0, 20).map(item => (
            <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => addItemLine(item)}>
              <Text style={styles.itemName} numberOfLines={1}>{item.displayName}</Text>
              <Text style={styles.itemDetail}>{item.number}</Text>
              <Text style={styles.itemCost}>{formatCurrency(item.unitCost)}</Text>
              <Text style={styles.itemStock}>Stock: {item.inventory}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Order Lines */}
      {orderLines.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Order Lines ({orderLines.length})</Text>
          {orderLines.map(line => (
            <View key={line.tempId} style={styles.lineCard}>
              <View style={styles.lineHeader}>
                <Text style={styles.lineName} numberOfLines={1}>{line.description}</Text>
                <TouchableOpacity onPress={() => removeLine(line.tempId)}>
                  <Icon name="close-circle" size={22} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.lineInputs}>
                <View style={styles.lineInputGroup}>
                  <Text style={styles.lineLabel}>Qty</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={line.quantity.toString()}
                    onChangeText={t => updateLine(line.tempId, { quantity: parseFloat(t) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.lineInputGroup}>
                  <Text style={styles.lineLabel}>Unit Cost</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={line.directUnitCost.toString()}
                    onChangeText={t => updateLine(line.tempId, { directUnitCost: parseFloat(t) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.lineInputGroup}>
                  <Text style={styles.lineLabel}>Disc %</Text>
                  <TextInput
                    style={styles.lineInput}
                    value={line.discountPercent.toString()}
                    onChangeText={t => updateLine(line.tempId, { discountPercent: parseFloat(t) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <Text style={styles.lineTotal}>Line Total: {formatCurrency(lineTotal(line))}</Text>
            </View>
          ))}
          <View style={styles.grandTotalBar}>
            <Text style={styles.grandTotalLabel}>Running Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );

  // Step 3: Details
  const renderDetailsStep = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.fieldLabel}>Order Date</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker('order')}>
        <Icon name="calendar" size={20} color={theme.colors.textSecondary} />
        <Text style={styles.dateText}>{orderDate.toLocaleDateString()}</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Requested Receipt Date</Text>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker('receipt')}>
        <Icon name="calendar-clock" size={20} color={theme.colors.textSecondary} />
        <Text style={styles.dateText}>{receiptDate ? receiptDate.toLocaleDateString() : 'Not set'}</Text>
      </TouchableOpacity>

      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={styles.notesInput}
        multiline
        numberOfLines={4}
        placeholder="Add notes or description..."
        placeholderTextColor={theme.colors.textLight}
        value={notes}
        onChangeText={setNotes}
      />

      {showDatePicker && (
        <DateTimePicker
          value={showDatePicker === 'order' ? orderDate : (receiptDate || new Date())}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowDatePicker(null);
            if (date) {
              if (showDatePicker === 'order') setOrderDate(date);
              else setReceiptDate(date);
            }
          }}
        />
      )}
    </ScrollView>
  );

  // Step 4: Review
  const renderReviewStep = () => (
    <ScrollView style={styles.stepContent}>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Vendor</Text>
        <Text style={styles.reviewValue}>{selectedVendor?.displayName}</Text>
        <Text style={styles.reviewDetail}>{selectedVendor?.number} · {selectedVendor?.city}</Text>
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Order Details</Text>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Order Date</Text>
          <Text style={styles.reviewValue}>{orderDate.toLocaleDateString()}</Text>
        </View>
        {receiptDate && (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Receipt Date</Text>
            <Text style={styles.reviewValue}>{receiptDate.toLocaleDateString()}</Text>
          </View>
        )}
        {notes ? (
          <View style={styles.reviewRow}>
            <Text style={styles.reviewLabel}>Notes</Text>
            <Text style={styles.reviewValue}>{notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.reviewCard}>
        <Text style={styles.reviewTitle}>Line Items ({orderLines.length})</Text>
        {orderLines.map(line => (
          <View key={line.tempId} style={styles.reviewLineItem}>
            <Text style={styles.reviewLineName}>{line.description}</Text>
            <View style={styles.reviewLineDetails}>
              <Text style={styles.reviewLineQty}>{line.quantity} x {formatCurrency(line.directUnitCost)}</Text>
              <Text style={styles.reviewLineAmount}>{formatCurrency(lineTotal(line))}</Text>
            </View>
          </View>
        ))}
        <View style={[styles.reviewRow, styles.reviewTotalRow]}>
          <Text style={styles.reviewTotalLabel}>Total</Text>
          <Text style={styles.reviewTotalValue}>{formatCurrency(grandTotal)}</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return renderVendorStep();
      case 1: return renderItemsStep();
      case 2: return renderDetailsStep();
      case 3: return renderReviewStep();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderStepIndicator()}
      <View style={styles.stepBody}>{renderStep()}</View>

      {/* Navigation Buttons */}
      <View style={styles.buttonBar}>
        {step > 0 && (
          <TouchableOpacity style={styles.backButton} onPress={() => setStep(step - 1)}>
            <Icon name="arrow-left" size={20} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        {step < 3 ? (
          <TouchableOpacity
            style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
            onPress={() => setStep(step + 1)}
            disabled={!canProceed()}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Icon name="arrow-right" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Icon name="check" size={20} color={theme.colors.white} />
                <Text style={styles.submitButtonText}>Submit Order</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  stepIndicator: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 8, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  stepCircleActive: { backgroundColor: theme.colors.primary },
  stepNumber: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary },
  stepNumberActive: { color: theme.colors.white },
  stepLabel: { fontSize: 11, color: theme.colors.textLight },
  stepLabelActive: { color: theme.colors.primary, fontWeight: '500' },
  stepBody: { flex: 1 },
  stepContent: { flex: 1, padding: theme.spacing.lg },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, paddingHorizontal: 12, marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, height: 44, marginLeft: 8, fontSize: 15, color: theme.colors.text },

  vendorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border },
  vendorCardSelected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  vendorDetail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },

  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  itemCard: { width: '48%', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 12, borderWidth: 1, borderColor: theme.colors.border },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  itemDetail: { fontSize: 12, color: theme.colors.textSecondary },
  itemCost: { fontSize: 14, fontWeight: '600', color: theme.colors.primary, marginTop: 4 },
  itemStock: { fontSize: 11, color: theme.colors.textLight, marginTop: 2 },

  subsectionTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginTop: 20, marginBottom: 12 },
  lineCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.colors.border },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lineName: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.text, marginRight: 8 },
  lineInputs: { flexDirection: 'row', gap: 10 },
  lineInputGroup: { flex: 1 },
  lineLabel: { fontSize: 11, color: theme.colors.textSecondary, marginBottom: 4 },
  lineInput: { backgroundColor: theme.colors.background, borderRadius: 6, padding: 8, fontSize: 14, textAlign: 'center', borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text },
  lineTotal: { fontSize: 14, fontWeight: '600', color: theme.colors.primary, textAlign: 'right', marginTop: 8 },
  grandTotalBar: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.sm, padding: 14, marginTop: 8 },
  grandTotalLabel: { fontSize: 15, fontWeight: '600', color: theme.colors.white },
  grandTotalValue: { fontSize: 17, fontWeight: '700', color: theme.colors.white },

  fieldLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 8, marginTop: 16 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 14, borderWidth: 1, borderColor: theme.colors.border, gap: 8 },
  dateText: { fontSize: 15, color: theme.colors.text },
  notesInput: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 14, fontSize: 15, borderWidth: 1, borderColor: theme.colors.border, textAlignVertical: 'top', minHeight: 100, color: theme.colors.text },

  reviewCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 12, ...theme.shadows.cardLight },
  reviewTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  reviewValue: { fontSize: 15, color: theme.colors.text },
  reviewDetail: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  reviewLabel: { fontSize: 14, color: theme.colors.textSecondary },
  reviewLineItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  reviewLineName: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  reviewLineDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  reviewLineQty: { fontSize: 13, color: theme.colors.textSecondary },
  reviewLineAmount: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  reviewTotalRow: { borderTopWidth: 2, borderTopColor: theme.colors.primary, marginTop: 8, paddingTop: 10 },
  reviewTotalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  reviewTotalValue: { fontSize: 18, fontWeight: '700', color: theme.colors.primary },

  buttonBar: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.white },
  backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, gap: 4 },
  backButtonText: { color: theme.colors.primary, fontSize: 15, fontWeight: '500' },
  nextButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: theme.borderRadius.sm, gap: 6 },
  nextButtonText: { color: theme.colors.white, fontSize: 15, fontWeight: '600' },
  submitButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.success, paddingVertical: 12, paddingHorizontal: 20, borderRadius: theme.borderRadius.sm, gap: 6 },
  submitButtonText: { color: theme.colors.white, fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },
  emptyText: { textAlign: 'center', color: theme.colors.textLight, marginTop: 32, fontSize: 14 },
});
