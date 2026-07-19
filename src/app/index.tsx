import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { EditSetModal } from '@/components/edit-set-modal';
import { ExercisePicker } from '@/components/exercise-picker';
import { QuickSetInput } from '@/components/quick-set-input';
import { SetBadge } from '@/components/set-badge';
import { Card, Screen, ScreenTitle, T } from '@/components/ui';
import { groupByExercise } from '@/lib/group-by-exercise';
import { localDay, prettyDate } from '@/lib/date';
import { useSession } from '@/store/session';
import { colors, radius, spacing } from '@/theme';

export default function TodayScreen() {
  const {
    sets,
    selectedExerciseId,
    selectedExerciseName,
    reps,
    weight,
    setReps,
    setWeight,
    setType,
    toggleSetType,
    commitSet,
    removeSet,
    cycleSetType,
    selectExercise,
    deselectExercise,
    editingSet,
    editReps,
    editWeight,
    editSetType,
    startEditSet,
    setEditReps,
    setEditWeight,
    toggleEditSetType,
    saveEditSet,
    cancelEditSet,
  } = useSession();

  const [pickerOpen, setPickerOpen] = useState(false);
  const groups = useMemo(() => groupByExercise(sets), [sets]);
  const totalSets = sets.length;
  const totalVolume = useMemo(
    () => Math.round(sets.reduce((a, s) => a + s.reps * s.weight, 0)),
    [sets],
  );

  const handleCommit = () => {
    const ok = commitSet();
    Haptics.notificationAsync(
      ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  };

  const handleSaveEdit = () => {
    const ok = saveEditSet();
    Haptics.notificationAsync(
      ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning,
    );
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <ScreenTitle>Bugün</ScreenTitle>
            <T variant="subhead" style={{ paddingHorizontal: spacing.lg, marginTop: -spacing.sm }}>
              {prettyDate(localDay())}
            </T>
          </View>
          {!selectedExerciseId && (
            <TouchableOpacity style={styles.addExerciseBtn} onPress={() => setPickerOpen(true)}>
              <T variant="subhead" color={colors.text} style={{ fontWeight: '700' }}>
                + Hareket Ekle
              </T>
            </TouchableOpacity>
          )}
        </View>

        {/* Aktif hareket + hızlı giriş */}
        {selectedExerciseId && (
          <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
            <Card elevated>
              <View style={styles.activeHeader}>
                <View style={{ flex: 1 }}>
                  <T variant="footnote" color={colors.textTertiary}>
                    AKTİF HAREKET
                  </T>
                  <T variant="title2" numberOfLines={1}>
                    {selectedExerciseName}
                  </T>
                </View>
                <TouchableOpacity onPress={deselectExercise} hitSlop={10} style={{ marginRight: spacing.lg }}>
                  <T variant="subhead" color={colors.textSecondary}>
                    Kapat
                  </T>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setPickerOpen(true)} hitSlop={10}>
                  <T variant="subhead" color={colors.move}>
                    Değiştir
                  </T>
                </TouchableOpacity>
              </View>
              <QuickSetInput
                reps={reps}
                weight={weight}
                onReps={setReps}
                onWeight={setWeight}
                onCommit={handleCommit}
                setType={setType}
                onToggleSetType={toggleSetType}
              />
            </Card>
          </View>
        )}

        {/* Oturum özeti */}
        {totalSets > 0 && (
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <T variant="statNumber" style={{ fontSize: 28 }}>
                {totalSets}
              </T>
              <T variant="caption">SET</T>
            </View>
            <View style={styles.summaryItem}>
              <T variant="statNumber" style={{ fontSize: 28 }}>
                {groups.length}
              </T>
              <T variant="caption">HAREKET</T>
            </View>
            <View style={styles.summaryItem}>
              <T variant="statNumber" style={{ fontSize: 28 }}>
                {totalVolume}
              </T>
              <T variant="caption">HACİM (KG)</T>
            </View>
          </View>
        )}

        {/* Girilen setler */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          {groups.map((g) => (
            <Card key={g.id} style={{ marginTop: spacing.md }}>
              <View style={styles.groupHead}>
                <T variant="headline">{g.name}</T>
                <T variant="footnote">{g.muscle}</T>
              </View>
              {g.items.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.setRow, s.set_type === 'dropset' && styles.setRowDropset]}
                  onPress={() => startEditSet(s)}
                  onLongPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    Alert.alert('Seti sil', `${s.set_number}. set silinsin mi?`, [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Sil', style: 'destructive', onPress: () => removeSet(s.id) },
                    ]);
                  }}>
                  <SetBadge
                    setNumber={s.set_number}
                    setType={s.set_type}
                    onPress={() => cycleSetType(s.id)}
                  />
                  <T variant="body" style={{ flex: 1 }}>
                    {s.reps} tekrar
                  </T>
                  <T variant="headline">{s.weight > 0 ? `${s.weight} kg` : 'vücut'}</T>
                </TouchableOpacity>
              ))}
            </Card>
          ))}

          {totalSets === 0 && !selectedExerciseId && (
            <View style={styles.empty}>
              <T variant="subhead" style={{ textAlign: 'center' }}>
                Henüz set yok. Yukarıdan bir hareket ekleyerek başla.
              </T>
            </View>
          )}
        </View>
      </ScrollView>

      <ExercisePicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(id, name) => selectExercise(id, name)}
      />

      <EditSetModal
        visible={editingSet != null}
        exerciseName={editingSet?.exercise_name ?? ''}
        reps={editReps}
        weight={editWeight}
        onReps={setEditReps}
        onWeight={setEditWeight}
        setType={editSetType}
        onToggleSetType={toggleEditSetType}
        onSave={handleSaveEdit}
        onDelete={() => {
          if (editingSet) removeSet(editingSet.id);
          cancelEditSet();
        }}
        onClose={cancelEditSet}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addExerciseBtn: {
    backgroundColor: colors.move,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  summaryItem: { alignItems: 'center' },
  groupHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  setRowDropset: {
    marginLeft: spacing.md,
  },
  empty: { paddingVertical: spacing.xxl, paddingHorizontal: spacing.lg },
});
