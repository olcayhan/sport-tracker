/** Tarih yardımcıları — hepsi cihazın yerel saat dilimine göre çalışır. */

/** Verilen tarihi (varsayılan: bugün) 'YYYY-MM-DD' yerel gün olarak döndürür. */
export function localDay(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 'YYYY-MM-DD' → yerel gün başlangıcına ayarlı Date. */
export function parseDay(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** İki gün arasındaki fark (gün sayısı, a - b). */
export function daysBetween(a: string, b: string): number {
  const ms = parseDay(a).getTime() - parseDay(b).getTime();
  return Math.round(ms / 86_400_000);
}

/** Güne n gün ekler/çıkarır, 'YYYY-MM-DD' döndürür. */
export function addDays(s: string, n: number): string {
  const d = parseDay(s);
  d.setDate(d.getDate() + n);
  return localDay(d);
}

const AY = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const AY_UZUN = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function shortMonth(monthIndex: number): string {
  return AY[monthIndex];
}

/** 'YYYY-MM-DD' → "12 Temmuz". */
export function prettyDate(s: string): string {
  const d = parseDay(s);
  return `${d.getDate()} ${AY_UZUN[d.getMonth()]}`;
}
