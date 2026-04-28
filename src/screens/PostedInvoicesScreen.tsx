import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

export default function PostedInvoicesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Posted Invoices</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  text: { ...theme.typography.h2, color: theme.colors.text },
});
