import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../config/theme';

interface Props {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function ActionButton({ title, onPress, icon, variant = 'primary', loading, disabled, style }: Props) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const bgColor = isPrimary ? theme.colors.primary : isDanger ? theme.colors.error : 'transparent';
  const textColor = isPrimary || isDanger ? theme.colors.white : theme.colors.primary;
  const borderColor = isPrimary ? theme.colors.primary : isDanger ? theme.colors.error : theme.colors.primary;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, borderColor }, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon && <Icon name={icon} size={18} color={textColor} style={styles.icon} />}
          <Text style={[styles.text, { color: textColor }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: theme.borderRadius.sm, borderWidth: 1 },
  disabled: { opacity: 0.5 },
  icon: { marginRight: 6 },
  text: { fontSize: 15, fontWeight: '600' },
});
