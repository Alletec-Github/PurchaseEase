import React from 'react';
import { formatCurrency } from '../services/format';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface Props {
  amount: number;
  currencyCode?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function CurrencyDisplay({ amount, currencyCode, size = 'medium', color }: Props) {
  const formatted = formatCurrency(amount, currencyCode);
  const fontSize = size === 'small' ? 13 : size === 'large' ? 20 : 15;
  return (
    <Text style={[styles.text, { fontSize, color: color || theme.colors.text }]}>
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '600' },
});
