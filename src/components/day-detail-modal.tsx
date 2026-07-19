import { useState } from 'react';
import { Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setsForDay } from '@/db/repositories/sets';
import type { SetWithExercise } from '@/db/types';
import { groupByExercise } from '@/lib/group-by-exercise';
import { prettyDate } from '@/lib/date';
import { colors, spacing } from '@/theme';

import { SetBadge } from './set-badge';
import { Card, ErrorState, LoadingState, T } from './ui';

interface Props {
  visible: boolean;
  day: string;
  onClose: () => void;
}

type Status = 'loading' | 'ready' | 'error';

/** Geçmiş bir günün setlerini salt-okunur gösteren yarım sayfa (Özet ekranındaki ısı haritasından açılır). */
export function DayDetailModal({ visible, day, onClose }: Props) {
  const [sets, setSets] = useState<SetWithExercise[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const refresh = () => {
    if (!day) return;
    try {
      setSets(setsForDay(day));
      setStatus('ready');
    } catch (e) {
      console.error('Gün detayı yüklenemedi', e);
      setStatus('error');
    }
  };

  const groups = groupByExercise(sets);
  const totalSets = sets.length;
  const totalVolume = Math.round(sets.reduce((a, s) => a + s.reps * s.weight, 0));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={refresh}
      onDismiss={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: spacing.md,
            }}>
            <T variant="title2">{day ? prettyDate(day) : ''}</T>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <T variant="headline" color={colors.move}>
                Kapat
              </T>
            </TouchableOpacity>
          </View>

          {status === 'loading' && <LoadingState />}

          {status === 'error' && (
            <ErrorState message="Gün detayı yüklenemedi." onRetry={refresh} />
          )}

          {status === 'ready' && (
            <>
              {totalSets > 0 && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-around',
                    marginBottom: spacing.lg,
                  }}>
                  <View style={{ alignItems: 'center' }}>
                    <T variant="statNumber" style={{ fontSize: 28 }}>
                      {totalSets}
                    </T>
                    <T variant="caption">SET</T>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <T variant="statNumber" style={{ fontSize: 28 }}>
                      {groups.length}
                    </T>
                    <T variant="caption">HAREKET</T>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <T variant="statNumber" style={{ fontSize: 28 }}>
                      {totalVolume}
                    </T>
                    <T variant="caption">HACİM (KG)</T>
                  </View>
                </View>
              )}

              <ScrollView
                contentContainerStyle={{ paddingBottom: spacing.xxl }}
                showsVerticalScrollIndicator={false}>
                {groups.map((g) => (
                  <Card key={g.id} style={{ marginBottom: spacing.md }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: spacing.sm,
                      }}>
                      <T variant="headline">{g.name}</T>
                      <T variant="footnote">{g.muscle}</T>
                    </View>
                    {g.items.map((s) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          paddingVertical: spacing.md,
                          marginLeft: s.set_type === 'dropset' ? spacing.md : 0,
                          borderTopWidth: 0.5,
                          borderTopColor: colors.separator,
                        }}>
                        <SetBadge setNumber={s.set_number} setType={s.set_type} />
                        <T variant="body" style={{ flex: 1 }}>
                          {s.reps} tekrar
                        </T>
                        <T variant="headline">{s.weight > 0 ? `${s.weight} kg` : 'vücut'}</T>
                      </View>
                    ))}
                  </Card>
                ))}

                {totalSets === 0 && (
                  <View style={{ paddingVertical: spacing.xxl }}>
                    <T variant="subhead" style={{ textAlign: 'center' }}>
                      Bu gün için kayıtlı set yok.
                    </T>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
