import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { LineChart, type ChartPoint } from '@/components/line-chart';
import { Card, ErrorState, LoadingState, Screen, ScreenTitle, T } from '@/components/ui';
import {
  exerciseProgress,
  exercisesWithData,
  personalRecord,
  type ExerciseProgressPoint,
} from '@/db/repositories/stats';
import { parseDay, shortMonth } from '@/lib/date';
import { colors, radius, spacing } from '@/theme';

type Metric = 'topWeight' | 'estOneRm' | 'volume';

const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: 'topWeight', label: 'En ağır set', unit: 'kg', color: colors.move },
  { key: 'estOneRm', label: 'Tahmini 1RM', unit: 'kg', color: colors.exercise },
  { key: 'volume', label: 'Hacim', unit: 'kg', color: colors.stand },
];

function shortLabel(date: string): string {
  const d = parseDay(date);
  return `${d.getDate()} ${shortMonth(d.getMonth())}`;
}

type Status = 'loading' | 'ready' | 'error';

export default function ProgressScreen() {
  const [exercises, setExercises] = useState<{ id: number; name: string; muscle_group: string }[]>(
    [],
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [metric, setMetric] = useState<Metric>('estOneRm');
  const [progress, setProgress] = useState<ExerciseProgressPoint[]>([]);
  const [pr, setPr] = useState<{ weight: number; reps: number } | null>(null);
  const [listStatus, setListStatus] = useState<Status>('loading');
  const [detailStatus, setDetailStatus] = useState<Status>('loading');

  const reloadList = useCallback(() => {
    try {
      const list = exercisesWithData();
      setExercises(list);
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
      setListStatus('ready');
    } catch (e) {
      console.error('Hareket listesi yüklenemedi', e);
      setListStatus('error');
    }
  }, []);

  useFocusEffect(useCallback(() => reloadList(), [reloadList]));

  const loadDetail = useCallback((id: number | null) => {
    if (id == null) {
      setProgress([]);
      setPr(null);
      setDetailStatus('ready');
      return;
    }
    try {
      setProgress(exerciseProgress(id, 10));
      setPr(personalRecord(id));
      setDetailStatus('ready');
    } catch (e) {
      console.error('İlerleme verisi yüklenemedi', e);
      setDetailStatus('error');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDetail(selectedId);
    }, [loadDetail, selectedId]),
  );

  const metricDef = METRICS.find((m) => m.key === metric)!;
  const points: ChartPoint[] = useMemo(
    () =>
      progress.map((p) => ({
        label: shortLabel(p.date),
        value: Math.round(p[metric]),
      })),
    [progress, metric],
  );

  const selectedName = exercises.find((e) => e.id === selectedId)?.name;

  if (listStatus === 'loading') {
    return (
      <Screen>
        <ScreenTitle>İlerleme</ScreenTitle>
        <LoadingState />
      </Screen>
    );
  }

  if (listStatus === 'error') {
    return (
      <Screen>
        <ScreenTitle>İlerleme</ScreenTitle>
        <ErrorState message="Hareket listesi yüklenemedi." onRetry={reloadList} />
      </Screen>
    );
  }

  if (exercises.length === 0) {
    return (
      <Screen>
        <ScreenTitle>İlerleme</ScreenTitle>
        <View style={styles.empty}>
          <T variant="subhead" style={{ textAlign: 'center' }}>
            Grafik için önce birkaç antrenman kaydet. Kaydettiğin her hareketin gelişimi burada
            görünecek.
          </T>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}>
        <ScreenTitle>İlerleme</ScreenTitle>

        {/* Hareket seçici çipleri */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}>
          {exercises.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={[styles.chip, selectedId === e.id && styles.chipActive]}
              onPress={() => {
                setSelectedId(e.id);
                loadDetail(e.id);
              }}>
              <T
                variant="subhead"
                color={selectedId === e.id ? colors.text : colors.textSecondary}>
                {e.name}
              </T>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Metrik seçici */}
        <View style={styles.segment}>
          {METRICS.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[styles.segBtn, metric === m.key && styles.segBtnActive]}
              onPress={() => setMetric(m.key)}>
              <T
                variant="footnote"
                color={metric === m.key ? colors.text : colors.textSecondary}>
                {m.label}
              </T>
            </TouchableOpacity>
          ))}
        </View>

        {detailStatus === 'loading' && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card>
              <LoadingState label="Grafik yükleniyor…" />
            </Card>
          </View>
        )}

        {detailStatus === 'error' && (
          <View style={{ paddingHorizontal: spacing.lg }}>
            <Card>
              <ErrorState
                message="İlerleme verisi yüklenemedi."
                onRetry={() => loadDetail(selectedId)}
              />
            </Card>
          </View>
        )}

        {detailStatus === 'ready' && (
          <>
            {/* Grafik */}
            <View style={{ paddingHorizontal: spacing.lg }}>
              <Card>
                <T variant="footnote" color={colors.textTertiary}>
                  {selectedName?.toUpperCase()} · SON {points.length} ANTRENMAN
                </T>
                <View style={{ marginTop: spacing.md }}>
                  <LineChart points={points} color={metricDef.color} unit={metricDef.unit} />
                </View>
              </Card>
            </View>

            {/* Kişisel rekor */}
            {pr && (
              <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
                <Card style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                  <T variant="title">🏆</T>
                  <View>
                    <T variant="footnote" color={colors.textTertiary}>
                      KİŞİSEL REKOR
                    </T>
                    <T variant="title2">
                      {pr.weight} kg × {pr.reps}
                    </T>
                  </View>
                </Card>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.cardElevated, borderWidth: 1, borderColor: colors.move },
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
  empty: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.xl },
});
