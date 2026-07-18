import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/theme';

/**
 * Apple tarzı native tab bar (SF Symbols ile). Rotalar:
 * index → Bugün/Kaydet, dashboard → Özet, progress → İlerleme, settings → Ayarlar.
 */
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={colors.bg}
      tintColor={colors.move}
      labelStyle={{ color: colors.textSecondary, selected: { color: colors.move } }}>
      <NativeTabs.Trigger name="index">
        <Label>Bugün</Label>
        <Icon sf={{ default: 'plus.circle', selected: 'plus.circle.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="dashboard">
        <Label>Özet</Label>
        <Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <Label>İlerleme</Label>
        <Icon sf="chart.line.uptrend.xyaxis" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Ayarlar</Label>
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
