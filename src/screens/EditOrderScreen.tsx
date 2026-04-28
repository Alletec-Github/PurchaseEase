import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
import type { PurchaseOrder, PurchaseOrderLine, Item } from '../types/api';

const formatCurrency = (amount: number) =>
  '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function EditOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [orderDate, setOrderDate] = useState(new Date());
  const [receiptDate, setReceiptDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'order' | 'receipt' | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemSearch, setItemSearch] = useState('');

  useEffect(() => {
    Promise.all([
      bcApi.getPurchaseOrder(orderId),
      bcApi.getPurchaseOrderLines(orderId),
      bcApi.getItems({ $orderby: 'displayName' }),
    ]).then(([o, l, i]) => {
      setOrder(o);
      setLines(l);
      setItems(i);
      setOrderDate(new Date(o.orderDate));
      if (o.requestedReceiptDate) setReceiptDate(new Date(o.requestedReceiptDate));
    }).catch((err) => {
      Alert.alert('Error', err.message || 'Failed to load order');
    }).finally(() => setLoading(false));
  }, [orderId]);

  const handleSave = async () => {
    if (!order) return;
    setSaving(true);
    try {
      await bcApi.updatePurchaseOrder(orderId, {
        orderDate: orderDate.toISOString().split('T')[0],
        requestedReceiptDate: receiptDate?.toISOString().split('T')[0] || '',
      }, order['@odata.etag']);
      Alert.alert('Saved', 'Order updated successfully');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLine = (lineId: string) => {
    Alert.alert('Delete Line', 'Remove this line item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await bcApi.deletePurchaseOrderLine(orderId, lineId);
            setLines(prev => prev.filter(l => l.id !== lineId));
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleAddItem = async (item: Item) => {
    try {
      const newLine = await bcApi.createPurchaseOrderLine(orderId, {
        lineType: 'Item',
        lineObjectNumber: item.number,
        quantity: 1,
        directUnitCost: item.unitCost,
        description: item.displayName,
        unitOfMeasureCode: item.baseUnitOfMeasureCode,
      });
      setLines(prev => [...prev, newLine]);
      setShowAddItem(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add line');
    }
  };

  const filteredItems = items.filter(i =>
    !i.blocked && (i.displayName.toLowerCase().includes(itemSearch.toLowerCase()) || i.number.includes(itemSearch)),
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Order Details</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Order Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker('order')}>
            <Icon name="calendar" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>{orderDate.toLocaleDateString()}</Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>Requested Receipt Date</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker('receipt')}>
            <Icon name="calendar-clock" size={18} color={theme.colors.textSecondary} />
            <Text style={styles.dateText}>{receiptDate ? receiptDate.toLocaleDateString() : 'Not set'}</Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.lineHeader}>
          <Text style={styles.sectionTitle}>Line Items ({lines.length})</Text>
          <TouchableOpacity onPress={() => setShowAddItem(!showAddItem)}>
            <Icon name={showAddItem ? 'close' : 'plus-circle'} size={28} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {showAddItem && (
          <View style={styles.addItemPanel}>
            <View style={styles.searchContainer}>
              <Icon name="magnify" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={theme.colors.textLight}
                value={itemSearch}
                onChangeText={setItemSearch}
              />
            </View>
            {filteredItems.slice(0, 10).map(item => (
              <TouchableOpacity key={item.id} style={styles.addItemRow} onPress={() => handleAddItem(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.addItemName}>{item.displayName}</Text>
                  <Text style={styles.addItemDetail}>{item.number} · {formatCurrency(item.unitCost)}</Text>
                </View>
                <Icon name="plus" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {lines.map(line => (
          <View key={line.id} style={styles.lineCard}>
            <View style={styles.lineTop}>
              <Text style={styles.lineName} numberOfLines={1}>{line.description}</Text>
              <TouchableOpacity onPress={() => handleDeleteLine(line.id)}>
                <Icon name="delete-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
            <Text style={styles.lineInfo}>
              {line.quantity} x {formatCurrency(line.directUnitCost)} = {formatCurrency(line.amountIncludingTax)}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.saveText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: theme.spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: theme.colors.text, marginBottom: 10 },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 16, marginBottom: 16, ...theme.shadows.cardLight },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6, marginTop: 10 },
  dateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 8, padding: 12, gap: 8, borderWidth: 1, borderColor: theme.colors.border },
  dateText: { fontSize: 15, color: theme.colors.text },

  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lineCard: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 14, marginBottom: 8, ...theme.shadows.cardLight },
  lineTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  lineName: { flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.text, marginRight: 8 },
  lineInfo: { fontSize: 13, color: theme.colors.textSecondary },

  addItemPanel: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 12, marginBottom: 12, ...theme.shadows.card },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.background, borderRadius: 8, paddingHorizontal: 10, marginBottom: 8 },
  searchInput: { flex: 1, height: 40, marginLeft: 6, fontSize: 14, color: theme.colors.text },
  addItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.borderLight },
  addItemName: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  addItemDetail: { fontSize: 12, color: theme.colors.textSecondary },

  actionBar: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.white },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: theme.borderRadius.sm, borderWidth: 1, borderColor: theme.colors.border },
  cancelText: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  saveButton: { flex: 2, alignItems: 'center', paddingVertical: 12, borderRadius: theme.borderRadius.sm, backgroundColor: theme.colors.primary },
  saveText: { fontSize: 15, fontWeight: '600', color: theme.colors.white },
});
