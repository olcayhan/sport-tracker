import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { DayDetailModal } from '@/components/day-detail-modal';
import { HeatLegend, Heatmap, HeatMode } from '@/components/heatmap';
import { Card, ErrorState, LoadingState, Screen, ScreenTitle, T } from '@/components/ui';
import {
  activityByDay,
  currentStreak,
  periodSummary,
  topMuscleGroup,
  type DayActivity,
  type PeriodSummary,
  type TopMuscle,
} from '@/db/repositories/stats';
import { addDays, localDay } from '@/lib/date';
import { colors, radius, spacing } from '@/theme';

type Trend = { text: string; color: string } | null;

/** Önceki eşdeğer döneme göre değişim etiketi. Azalışı "hata" gibi işaretlemez — nötr renk kullanır. */
function trendLabel(curr: number, prev: number): Trend {
  if (prev === 0) {
    if (curr === 0) return null;
    return { text: 'Yeni', color: colors.exercise };
  }
  const pct = Math.round(((curr - prev) / prev) * 100);
  if (pct === 0) return { text: '±0%', color: colors.textSecondary };
  return {
    text: `${pct > 0 ? '+' : ''}${pct}%`,
    color: pct > 0 ? colors.exercise : colors.textSecondary,
  };
}

function StatTile({
  value,
  label,
  accent,
  suffix,
  trend,
}: {
  value: string | number;
  label: string;
  accent: string;
  suffix?: string;
  trend?: Trend;
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
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: 6 }}>
        <T variant="footnote">{label}</T>
        {trend ? (
          <T variant="caption" color={trend.color}>
            {trend.text}
          </T>
        ) : null}
      </View>
    </Card>
  );
}

type Status = 'loading' | 'ready' | 'error';

const emptyPeriod: PeriodSummary = { trainedDays: 0, volume: 0 };

export default function DashboardScreen() {
  const [mode, setMode] = useState<HeatMode>('recent');
  const [data, setData] = useState<DayActivity[]>([]);
  const [current, setCurrent] = useState<PeriodSummary>(emptyPeriod);
  const [previous, setPrevious] = useState<PeriodSummary>(emptyPeriod);
  const [periodDays, setPeriodDays] = useState(30);
  const [topMuscle, setTopMuscle] = useState<TopMuscle | null>(null);
  const [streak, setStreak] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // 'loading' yalnızca ilk yüklemede gösterilir; sonraki tazelemelerde (odak/mod değişimi)
  // eski içerik ekranda kalır, hata olursa 'error'a döner.
  const [status, setStatus] = useState<Status>('loading');

  const load = useCallback(() => {
    try {
      const today = localDay();
      const spanDays = mode === 'year' ? 371 : 30;
      const from = addDays(today, -(spanDays - 1));
      const prevTo = addDays(from, -1);
      const prevFrom = addDays(prevTo, -(spanDays - 1));

      setData(activityByDay(from, today));
      setCurrent(periodSummary(from, today));
      setPrevious(periodSummary(prevFrom, prevTo));
      setTopMuscle(topMuscleGroup(from, today));
      setPeriodDays(spanDays);
      setStreak(currentStreak());
      setStatus('ready');
    } catch (e) {
      console.error('Özet verileri yüklenemedi', e);
      setStatus('error');
    }
  }, [mode]);

  useFocusEffect(useCallback(() => load(), [load]));

  const periodLabel = mode === 'year' ? 'Bu yıl' : 'Son 30 günde';
  const muscleTitle = mode === 'year' ? 'BU YIL EN ÇOK' : 'SON 30 GÜNDE EN ÇOK';
  const weeklyAvg = (current.trainedDays / (periodDays / 7)).toFixed(1);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <ScreenTitle>Özet</ScreenTitle>

        {status === 'loading' && <LoadingState />}

        {status === 'error' && (
          <ErrorState message="Özet verileri yüklenemedi." onRetry={load} />
        )}

        {status === 'ready' && (
          <>
            {/* Segmented control */}
            <View style={styles.segment}>
              {(['recent', 'year'] as HeatMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.segBtn, mode === m && styles.segBtnActive]}
                  onPress={() => setMode(m)}
                  activeOpacity={0.8}>
                  <T variant="subhead" color={mode === m ? colors.text : colors.textSecondary}>
                    {m === 'year' ? 'Yıllık' : 'Son 30 Gün'}
                  </T>
                </TouchableOpacity>
              ))}
            </View>

            {/* Heatmap */}
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Card>
                <Heatmap data={data} mode={mode} onSelectDay={setSelectedDay} />
                <HeatLegend />
              </Card>
            </View>

            {/* İstatistik kutucukları */}
            <View style={styles.grid}>
              <StatTile
                value={streak}
                label="Gün üst üste (seri)"
                accent={colors.move}
                suffix="🔥"
              />
              <StatTile
                value={current.trainedDays}
                label={`${periodLabel} antrenman`}
                accent={colors.exercise}
                trend={trendLabel(current.trainedDays, previous.trainedDays)}
              />
              <StatTile
                value={current.volume}
                label={`${periodLabel} hacim`}
                accent={colors.stand}
                suffix="kg"
                trend={trendLabel(current.volume, previous.volume)}
              />
              <StatTile
                value={weeklyAvg}
                label="Haftalık ortalama"
                accent={colors.yellow}
                suffix="kez/hafta"
              />
            </View>

            {topMuscle && (
              <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
                <Card>
                  <T variant="footnote" color={colors.textTertiary}>
                    {muscleTitle}
                  </T>
                  <T variant="title2" style={{ marginTop: spacing.xs }}>
                    {topMuscle.muscleGroup}
                  </T>
                  <T variant="footnote" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {topMuscle.sets} set · toplamın %{topMuscle.pct}&apos;i
                  </T>
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <DayDetailModal
        visible={selectedDay != null}
        day={selectedDay ?? ''}
        onClose={() => setSelectedDay(null)}
      />
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
