import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = 'package-variant', title, subtitle }: Props) {
  return (
    <View style={styles.container}>
      <Icon name={icon} size={56} color={theme.colors.textLight} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48 },
  title: { fontSize: 17, fontWeight: '500', color: theme.colors.textSecondary, marginTop: 12 },
  subtitle: { fontSize: 14, color: theme.colors.textLight, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
});
