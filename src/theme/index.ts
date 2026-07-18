/**
 * Apple Fitness–esinli tema.
 * Koyu tema öncelikli: siyah zemin, katmanlı koyu kartlar, canlı "ring" renkleri,
 * büyük ve kalın rakamlar. iOS'ta sistem fontu (San Francisco) otomatik gelir.
 */
import { Platform, TextStyle } from 'react-native';

export const colors = {
  // Zeminler (Apple system dark)
  bg: '#000000',
  card: '#1C1C1E',
  cardElevated: '#2C2C2E',
  cardPressed: '#3A3A3C',
  separator: '#38383A',

  // Metin
  text: '#FFFFFF',
  textSecondary: '#98989F',
  textTertiary: '#636366',

  // Apple Fitness "Activity Ring" renkleri
  move: '#FA114F', // kırmızı/pembe — birincil vurgu
  moveGlow: '#FF375F',
  exercise: '#B0FC38', // yeşil
  stand: '#00D5E8', // camgöbeği

  // Yardımcı vurgular
  accent: '#FA114F',
  blue: '#0A84FF',
  orange: '#FF9F0A',
  yellow: '#FFD60A',
  purple: '#BF5AF2',

  // Heatmap yoğunluk skalası (düşük → yüksek), boş gün için ilk değer
  heat: ['#1C1C1E', '#3A1220', '#7A0E30', '#C40E42', '#FA114F'] as const,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const fontFamily = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
})!;

/** Ortak metin stilleri — büyük rakamlar için "rounded" (SF Pro Rounded) kullanılır. */
export const typography = {
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
  } as TextStyle,
  title: { fontSize: 28, fontWeight: '700', color: colors.text } as TextStyle,
  title2: { fontSize: 22, fontWeight: '700', color: colors.text } as TextStyle,
  headline: { fontSize: 17, fontWeight: '600', color: colors.text } as TextStyle,
  body: { fontSize: 17, fontWeight: '400', color: colors.text } as TextStyle,
  callout: { fontSize: 16, fontWeight: '400', color: colors.text } as TextStyle,
  subhead: { fontSize: 15, fontWeight: '400', color: colors.textSecondary } as TextStyle,
  footnote: { fontSize: 13, fontWeight: '400', color: colors.textSecondary } as TextStyle,
  caption: { fontSize: 12, fontWeight: '500', color: colors.textTertiary } as TextStyle,
  /** Büyük istatistik rakamı (ör. dashboard kutucukları). */
  statNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.text,
    fontFamily: fontFamily.rounded,
  } as TextStyle,
} as const;
