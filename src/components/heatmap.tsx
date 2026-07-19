import { useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { DayActivity } from '@/db/repositories/stats';
import { addDays, localDay, parseDay, shortMonth } from '@/lib/date';
import { colors, radius, spacing } from '@/theme';

import { T } from './ui';

const CELL = 13;
const GAP = 3;
const RECENT_CELL = 30;
const RECENT_GAP = 6;
const RECENT_WINDOW_DAYS = 30;
const WEEKDAYS = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz'];

// Başlık satırı her iki ızgarada da aynı sabit yüksekliği alır (yazı tipi metriklerine bağlı kalmadan).
const HEADER_HEIGHT = 16;
// Son 30 gün penceresi hizalamaya bağlı olarak en fazla 6 hafta satırına yayılabilir; Yıllık
// ızgara bu en yüksek duruma göre ortalanır, böylece sekme değişince kart boyu sabit kalır.
const RECENT_MAX_ROWS = 6;
const GRID_AREA_HEIGHT =
  HEADER_HEIGHT + RECENT_GAP + RECENT_MAX_ROWS * RECENT_CELL + (RECENT_MAX_ROWS - 1) * RECENT_GAP;

export type HeatMode = 'year' | 'recent';

interface Props {
  data: DayActivity[];
  mode: HeatMode;
  onSelectDay?: (day: string) => void;
}

/** volume → 0..4 yoğunluk seviyesi (aralıktaki en yükseğe göre). */
function levelFor(volume: number, max: number): number {
  if (volume <= 0 || max <= 0) return 0;
  const r = volume / max;
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

/** Pazartesi'yi haftanın başı yapan indeks (0=Pzt … 6=Paz). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

export function Heatmap({ data, mode, onSelectDay }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.volume);
    return m;
  }, [data]);

  const max = useMemo(() => data.reduce((a, d) => Math.max(a, d.volume), 0), [data]);

  return (
    <View style={styles.gridArea}>
      {mode === 'year' ? (
        <YearGrid byDay={byDay} max={max} scrollRef={scrollRef} onSelectDay={onSelectDay} />
      ) : (
        <RecentGrid byDay={byDay} max={max} onSelectDay={onSelectDay} />
      )}
    </View>
  );
}

/* ----------------------------- Yıllık ızgara ----------------------------- */

function YearGrid({
  byDay,
  max,
  scrollRef,
  onSelectDay,
}: {
  byDay: Map<string, number>;
  max: number;
  scrollRef: React.RefObject<ScrollView | null>;
  onSelectDay?: (day: string) => void;
}) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = localDay();
    // 53 haftalık pencere; haftanın başını (Pzt) hizala.
    let start = addDays(today, -364);
    const startDate = parseDay(start);
    start = addDays(start, -mondayIndex(startDate));

    const weeks: { date: string; level: number }[][] = [];
    const monthLabels: { col: number; label: string }[] = [];
    let cursor = start;
    let col = 0;
    let lastMonth = -1;

    while (parseDay(cursor) <= parseDay(today)) {
      const week: { date: string; level: number }[] = [];
      for (let r = 0; r < 7; r++) {
        const d = cursor;
        const dt = parseDay(d);
        const isFuture = dt > parseDay(today);
        week.push({
          date: d,
          level: isFuture ? -1 : levelFor(byDay.get(d) ?? 0, max),
        });
        // Ay etiketi: haftanın ilk gününde ay değişmişse
        if (r === 0) {
          const m = dt.getMonth();
          if (m !== lastMonth) {
            monthLabels.push({ col, label: shortMonth(m) });
            lastMonth = m;
          }
        }
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
      col++;
    }
    return { weeks, monthLabels };
  }, [byDay, max]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
      <View>
        {/* Ay etiketleri */}
        <View style={styles.monthLabelRow}>
          {weeks.map((_, i) => {
            const label = monthLabels.find((m) => m.col === i)?.label ?? '';
            return (
              <View key={i} style={{ width: CELL + GAP }}>
                <T variant="caption" style={{ fontSize: 10 }}>
                  {label}
                </T>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', gap: GAP }}>
          {weeks.map((week, i) => (
            <View key={i} style={{ gap: GAP }}>
              {week.map((cell, r) => (
                <Cell
                  key={r}
                  level={cell.level}
                  onPress={cell.level >= 0 ? () => onSelectDay?.(cell.date) : undefined}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/* --------------------------- Son 30 gün ızgarası -------------------------- */

function RecentGrid({
  byDay,
  max,
  onSelectDay,
}: {
  byDay: Map<string, number>;
  max: number;
  onSelectDay?: (day: string) => void;
}) {
  const weeks = useMemo(() => {
    const today = localDay();
    const windowStart = addDays(today, -(RECENT_WINDOW_DAYS - 1)); // bugün dahil son 30 gün
    // Pencereyi tam haftalar halinde göstermek için başlangıcı Pazartesi'ye hizala.
    let start = addDays(windowStart, -mondayIndex(parseDay(windowStart)));

    const weeks: { date: string; level: number }[][] = [];
    let cursor = start;
    while (parseDay(cursor) <= parseDay(today)) {
      const week: { date: string; level: number }[] = [];
      for (let r = 0; r < 7; r++) {
        const d = cursor;
        const dt = parseDay(d);
        // Pencere dışı (hizalama için eklenen geçmiş günler ya da bu haftanın henüz gelmemiş günleri).
        const outsideWindow = dt < parseDay(windowStart) || dt > parseDay(today);
        week.push({
          date: d,
          level: outsideWindow ? -1 : levelFor(byDay.get(d) ?? 0, max),
        });
        cursor = addDays(cursor, 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [byDay, max]);

  return (
    <View>
      <T variant="headline" style={{ marginBottom: spacing.md }}>
        Son 30 Gün
      </T>
      <View style={styles.recentGrid}>
        <View style={styles.recentHeaderRow}>
          {WEEKDAYS.map((w, i) => (
            <View key={i} style={styles.recentCellWrap}>
              <T variant="caption" style={{ fontSize: 10 }}>
                {w || '·'}
              </T>
            </View>
          ))}
        </View>
        {weeks.map((week, i) => (
          <View key={i} style={styles.recentRow}>
            {week.map((cell, r) => (
              <View key={r} style={styles.recentCellWrap}>
                <Cell
                  level={cell.level}
                  big
                  onPress={cell.level >= 0 ? () => onSelectDay?.(cell.date) : undefined}
                />
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/* ------------------------------- Hücre ---------------------------------- */

function Cell({ level, big, onPress }: { level: number; big?: boolean; onPress?: () => void }) {
  const size = big ? RECENT_CELL : CELL;
  const bg = level < 0 ? 'transparent' : colors.heat[level];
  const box = {
    width: size,
    height: size,
    borderRadius: big ? radius.sm : 3,
    backgroundColor: bg,
    // Boş günler zeminle aynı renkte olduğu için kutucuk sınırı olmadan görünmez oluyor;
    // aynı tondan ince bir kenarlık ızgarayı okunur kılar, dolu günlerle kontrastı bozmaz.
    ...(level === 0 ? { borderWidth: 1, borderColor: colors.separator } : null),
  };
  if (!onPress) return <View style={box} />;
  return (
    <Pressable onPress={onPress} hitSlop={2}>
      <View style={box} />
    </Pressable>
  );
}

/** Alt köşedeki "az → çok" göstergesi (Apple/GitHub tarzı). */
export function HeatLegend() {
  return (
    <View style={styles.legend}>
      <T variant="caption">az</T>
      {colors.heat.map((c, i) => (
        <View key={i} style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: c }} />
      ))}
      <T variant="caption">çok</T>
    </View>
  );
}

const styles = StyleSheet.create({
  gridArea: { minHeight: GRID_AREA_HEIGHT, justifyContent: 'center' },
  monthLabelRow: { flexDirection: 'row', height: HEADER_HEIGHT, marginBottom: spacing.xs },
  recentGrid: { alignItems: 'center', gap: RECENT_GAP },
  recentHeaderRow: { flexDirection: 'row', height: HEADER_HEIGHT },
  recentRow: { flexDirection: 'row', gap: RECENT_GAP },
  recentCellWrap: {
    width: RECENT_CELL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
});
