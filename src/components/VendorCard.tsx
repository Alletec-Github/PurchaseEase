import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';

interface Props {
  name: string;
  number: string;
  city?: string;
  onPress?: () => void;
  selected?: boolean;
}

export default function VendorCard({ name, number, city, onPress, selected }: Props) {
  return (
    <TouchableOpacity style={[styles.card, selected && styles.selected]} onPress={onPress} activeOpacity={0.7} disabled={!onPress}>
      <Icon name="store" size={24} color={selected ? theme.colors.primary : theme.colors.textSecondary} />
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>{number}{city ? ` · ${city}` : ''}</Text>
      </View>
      {selected && <Icon name="check-circle" size={20} color={theme.colors.primary} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.sm, padding: 12, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: theme.colors.borderLight },
  selected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight },
  content: { flex: 1 },
  name: { fontSize: 15, fontWeight: '500', color: theme.colors.text },
  detail: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
});
