import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { theme } from '../config/theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormInput({ label, error, required, style, ...inputProps }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}{required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={theme.colors.textLight}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 6 },
  required: { color: theme.colors.error },
  input: { backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: theme.colors.text },
  inputError: { borderColor: theme.colors.error },
  error: { fontSize: 12, color: theme.colors.error, marginTop: 4 },
});
