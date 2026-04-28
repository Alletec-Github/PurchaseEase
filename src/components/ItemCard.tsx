import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../config/theme';
import CurrencyDisplay from './CurrencyDisplay';

interface Props {
  name: string;
  number: string;
  unitCost: number;
  inventory?: number;
  onPress?: () => void;
  selected?: boolean;
}

export default function ItemCard({ name, number, unitCost, inventory, onPress, selected }: Props) {
  return (
    <TouchableOpacity style={[styles.card, selected && styles.selected]} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.detail}>{number}{inventory != null ? ` · Stock: ${inventory}` : ''}</Text>
      </View>
      <CurrencyDisplay amount={unitCost} size="small" color={theme.colors.textSecondary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: theme.colors.borderLight },
  selected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  content: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: '500', color: theme.colors.text },
  detail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
});
