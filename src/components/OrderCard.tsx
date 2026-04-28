import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';
import StatusBadge from './StatusBadge';
import CurrencyDisplay from './CurrencyDisplay';

interface Props {
  number: string;
  vendorName: string;
  date: string;
  status: string;
  totalAmount: number;
  onPress: () => void;
}

export default function OrderCard({ number, vendorName, date, status, totalAmount, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.number}>{number}</Text>
          <Text style={styles.vendor}>{vendorName}</Text>
        </View>
        <CurrencyDisplay amount={totalAmount} color={theme.colors.primary} />
      </View>
      <View style={styles.bottom}>
        <View style={styles.dateRow}>
          <Icon name="calendar" size={14} color={theme.colors.textLight} />
          <Text style={styles.date}>{date}</Text>
        </View>
        <StatusBadge status={status} size="small" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: 14, marginBottom: 10, ...theme.shadows.cardLight },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  number: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  vendor: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  bottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  date: { fontSize: 12, color: theme.colors.textLight },
});
