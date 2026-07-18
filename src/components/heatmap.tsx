import { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { DayActivity } from '@/db/repositories/stats';
import { addDays, localDay, parseDay, shortMonth } from '@/lib/date';
import { colors, radius, spacing } from '@/theme';

import { T } from './ui';

const CELL = 13;
const GAP = 3;
const WEEKDAYS = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz'];

export type HeatMode = 'year' | 'month';

interface Props {
  data: DayActivity[];
  mode: HeatMode;
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

export function Heatmap({ data, mode }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.volume);
    return m;
  }, [data]);

  const max = useMemo(() => data.reduce((a, d) => Math.max(a, d.volume), 0), [data]);

  if (mode === 'year') {
    return <YearGrid byDay={byDay} max={max} scrollRef={scrollRef} />;
  }
  return <MonthGrid byDay={byDay} max={max} />;
}

/* ----------------------------- Yıllık ızgara ----------------------------- */

function YearGrid({
  byDay,
  max,
  scrollRef,
}: {
  byDay: Map<string, number>;
  max: number;
  scrollRef: React.RefObject<ScrollView | null>;
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
        <View style={styles.monthRow}>
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
        <View style={{ flexDirection: 'row' }}>
          {weeks.map((week, i) => (
            <View key={i} style={{ marginRight: GAP }}>
              {week.map((cell, r) => (
                <Cell key={r} level={cell.level} />
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/* ----------------------------- Aylık ızgara ------------------------------ */

function MonthGrid({ byDay, max }: { byDay: Map<string, number>; max: number }) {
  const { rows, monthTitle } = useMemo(() => {
    const today = parseDay(localDay());
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lead = mondayIndex(first); // baştaki boş kutular

    const cells: ({ date: string; level: number } | null)[] = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const d = localDay(new Date(year, month, day));
      const isFuture = parseDay(d) > parseDay(localDay());
      cells.push({ date: d, level: isFuture ? -1 : levelFor(byDay.get(d) ?? 0, max) });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows: (typeof cells)[] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];
    return { rows, monthTitle: `${monthNames[month]} ${year}` };
  }, [byDay, max]);

  return (
    <View>
      <T variant="headline" style={{ marginBottom: spacing.md }}>
        {monthTitle}
      </T>
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w, i) => (
          <View key={i} style={styles.monthCellWrap}>
            <T variant="caption" style={{ fontSize: 10 }}>
              {w || '·'}
            </T>
          </View>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          {row.map((cell, r) => (
            <View key={r} style={styles.monthCellWrap}>
              {cell ? <Cell level={cell.level} big /> : <View style={{ width: CELL * 1.6, height: CELL * 1.6 }} />}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/* ------------------------------- Hücre ---------------------------------- */

function Cell({ level, big }: { level: number; big?: boolean }) {
  const size = big ? CELL * 1.6 : CELL;
  const bg = level < 0 ? 'transparent' : colors.heat[level];
  return (
    <View
      style={{
        width: size,
        height: size,
        marginBottom: GAP,
        borderRadius: big ? radius.sm : 3,
        backgroundColor: bg,
      }}
    />
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
  monthRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekdayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  monthCellWrap: {
    flex: 1,
    alignItems: 'center',
    marginBottom: GAP,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
});
