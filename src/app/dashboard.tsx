import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HeatLegend, Heatmap, HeatMode } from '@/components/heatmap';
import { Card, Screen, ScreenTitle, T } from '@/components/ui';
import {
  activityByDay,
  currentStreak,
  summary,
  type DayActivity,
  type Summary,
} from '@/db/repositories/stats';
import { addDays, localDay } from '@/lib/date';
import { colors, radius, spacing } from '@/theme';

function StatTile({
  value,
  label,
  accent,
  suffix,
}: {
  value: string | number;
  label: string;
  accent: string;
  suffix?: string;
}) {
  return (
    <Card style={styles.tile}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <T variant="statNumber" color={accent}>
          {value}
        </T>
        {suffix ? (
          <T variant="headline" color={accent} style={{ marginLeft: 4 }}>
            {suffix}
          </T>
        ) : null}
      </View>
      <T variant="footnote" style={{ marginTop: spacing.xs }}>
        {label}
      </T>
    </Card>
  );
}

export default function DashboardScreen() {
  const [mode, setMode] = useState<HeatMode>('year');
  const [data, setData] = useState<DayActivity[]>([]);
  const [stats, setStats] = useState<Summary | null>(null);
  const [streak, setStreak] = useState(0);

  const load = useCallback(() => {
    const today = localDay();
    const from = mode === 'year' ? addDays(today, -370) : today.slice(0, 7) + '-01';
    setData(activityByDay(from, today));
    setStats(summary());
    setStreak(currentStreak());
  }, [mode]);

  useFocusEffect(useCallback(() => load(), [load]));

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <ScreenTitle>Özet</ScreenTitle>

        {/* Segmented control */}
        <View style={styles.segment}>
          {(['year', 'month'] as HeatMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.segBtn, mode === m && styles.segBtnActive]}
              onPress={() => setMode(m)}
              activeOpacity={0.8}>
              <T variant="subhead" color={mode === m ? colors.text : colors.textSecondary}>
                {m === 'year' ? 'Yıllık' : 'Aylık'}
              </T>
            </TouchableOpacity>
          ))}
        </View>

        {/* Heatmap */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Card>
            <Heatmap data={data} mode={mode} />
            <HeatLegend />
          </Card>
        </View>

        {/* İstatistik kutucukları */}
        <View style={styles.grid}>
          <StatTile value={streak} label="Gün üst üste (seri)" accent={colors.move} suffix="🔥" />
          <StatTile
            value={stats?.workoutsThisMonth ?? 0}
            label="Bu ay antrenman"
            accent={colors.exercise}
          />
          <StatTile
            value={stats?.volumeThisMonth ?? 0}
            label="Bu ay hacim"
            accent={colors.stand}
            suffix="kg"
          />
          <StatTile
            value={stats?.totalWorkouts ?? 0}
            label="Toplam antrenman"
            accent={colors.yellow}
          />
        </View>

        {stats?.topMuscle && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
            <Card>
              <T variant="footnote" color={colors.textTertiary}>
                SON 30 GÜNDE EN ÇOK
              </T>
              <T variant="title2" style={{ marginTop: spacing.xs }}>
                {stats.topMuscle}
              </T>
            </Card>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 3,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  segBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segBtnActive: { backgroundColor: colors.cardElevated },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  tile: {
    width: '48.5%',
    marginBottom: spacing.md,
  },
});
