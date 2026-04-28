import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function QuantityInput({ value, onChange, min = 1, max = 99999 }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, value <= min && styles.disabled]}
        onPress={() => value > min && onChange(value - 1)}
        disabled={value <= min}>
        <Icon name="minus" size={18} color={value <= min ? theme.colors.textLight : theme.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.value}>{value}</Text>
      <TouchableOpacity
        style={[styles.button, value >= max && styles.disabled]}
        onPress={() => value < max && onChange(value + 1)}
        disabled={value >= max}>
        <Icon name="plus" size={18} color={value >= max ? theme.colors.textLight : theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, overflow: 'hidden' },
  button: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.colors.background },
  disabled: { opacity: 0.4 },
  value: { paddingHorizontal: 16, fontSize: 15, fontWeight: '600', color: theme.colors.text, minWidth: 48, textAlign: 'center' },
});
