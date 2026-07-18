import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Card, Screen, ScreenTitle, SectionHeader, T } from '@/components/ui';
import { addExercise, deleteExercise, listExercises } from '@/db/repositories/exercises';
import type { Exercise } from '@/db/types';
import { colors, radius, spacing } from '@/theme';

export default function SettingsScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');

  const reload = useCallback(() => setExercises(listExercises()), []);
  useFocusEffect(useCallback(() => reload(), [reload]));

  const handleAdd = () => {
    if (name.trim().length < 2) return;
    addExercise(name, muscle.trim() || 'Diğer');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName('');
    setMuscle('');
    reload();
  };

  const handleDelete = (ex: Exercise) => {
    Alert.alert('Hareketi sil', `“${ex.name}” silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          try {
            deleteExercise(ex.id);
            reload();
          } catch {
            Alert.alert(
              'Silinemedi',
              'Bu hareketin kayıtlı setleri var. Önce ilgili antrenman verilerini silmelisin.',
            );
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ScreenTitle>Ayarlar</ScreenTitle>

        <View style={{ paddingHorizontal: spacing.lg }}>
          <SectionHeader>Yeni hareket ekle</SectionHeader>
          <Card>
            <TextInput
              style={styles.input}
              placeholder="Hareket adı (ör. Face Pull)"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <View style={{ height: spacing.sm }} />
            <TextInput
              style={styles.input}
              placeholder="Kas grubu (ör. Omuz)"
              placeholderTextColor={colors.textTertiary}
              value={muscle}
              onChangeText={setMuscle}
            />
            <TouchableOpacity
              style={[styles.addBtn, name.trim().length < 2 && { opacity: 0.4 }]}
              onPress={handleAdd}
              disabled={name.trim().length < 2}>
              <T variant="headline" color="#fff">
                Ekle
              </T>
            </TouchableOpacity>
          </Card>

          <SectionHeader>Hareket kütüphanesi</SectionHeader>
          <Card style={{ paddingVertical: spacing.xs }}>
            {exercises.map((ex, i) => (
              <View
                key={ex.id}
                style={[styles.row, i > 0 && styles.rowBorder]}>
                <View style={{ flex: 1 }}>
                  <T variant="body">{ex.name}</T>
                  <T variant="footnote">{ex.muscle_group}</T>
                </View>
                <TouchableOpacity onPress={() => handleDelete(ex)} hitSlop={10}>
                  <T variant="subhead" color={colors.move}>
                    Sil
                  </T>
                </TouchableOpacity>
              </View>
            ))}
          </Card>

          <SectionHeader>Hakkında</SectionHeader>
          <Card>
            <T variant="footnote">
              Tüm veriler yalnızca bu cihazda saklanır. Ağırlık birimi: kg. Bir sonraki aşamada
              yapay zekâ destekli performans önerileri eklenecek.
            </T>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.cardElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 17,
  },
  addBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.move,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  rowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
});
