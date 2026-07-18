import { ReactNode } from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme';

/** Ekranların ortak siyah zemin + güvenli alan sarmalayıcısı. */
export function Screen({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={[styles.safe, style]}>
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Apple tarzı köşeleri yuvarlatılmış koyu kart. */
export function Card({
  children,
  style,
  elevated,
}: {
  children: ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}) {
  return (
    <View
      style={[styles.card, { backgroundColor: elevated ? colors.cardElevated : colors.card }, style]}>
      {children}
    </View>
  );
}

export function ScreenTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.screenTitle}>{children}</Text>;
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionHeader}>{children}</Text>;
}

export function T({
  children,
  variant = 'body',
  style,
  color,
  numberOfLines,
}: {
  children: ReactNode;
  variant?: keyof typeof typography;
  style?: TextStyle;
  color?: string;
  numberOfLines?: number;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[typography[variant], color ? { color } : null, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  screenTitle: {
    ...typography.largeTitle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  sectionHeader: {
    ...typography.footnote,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
});
