import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../config/theme';

const STATUS_MAP: Record<string, { bg: string; color: string }> = {
  Draft: { bg: theme.colors.statusDraftBg, color: theme.colors.statusDraft },
  Open: { bg: theme.colors.statusOpenBg, color: theme.colors.statusOpen },
  'In Review': { bg: theme.colors.statusInReviewBg, color: theme.colors.statusInReview },
  Received: { bg: theme.colors.statusReceivedBg, color: theme.colors.statusReceived },
  Posted: { bg: theme.colors.statusReceivedBg, color: theme.colors.statusReceived },
};

interface Props {
  status: string;
  size?: 'small' | 'medium';
}

export default function StatusBadge({ status, size = 'medium' }: Props) {
  const { bg, color } = STATUS_MAP[status] || { bg: '#F0F0F0', color: '#666' };
  const isSmall = size === 'small';
  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.small]}>
      <Text style={[styles.text, { color }, isSmall && styles.smallText]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  small: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  text: { fontSize: 13, fontWeight: '600' },
  smallText: { fontSize: 11 },
});
