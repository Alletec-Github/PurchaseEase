import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

interface Props {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export default function CurrencyDisplay({ amount, size = 'medium', color }: Props) {
  const formatted = '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
