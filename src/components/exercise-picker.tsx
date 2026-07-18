import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addExercise, listExercises } from '@/db/repositories/exercises';
import type { Exercise } from '@/db/types';
import { colors, radius, spacing } from '@/theme';

import { T } from './ui';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: number, name: string) => void;
}

type Row = { type: 'header'; title: string } | { type: 'item'; ex: Exercise };

/** Kas grubuna göre gruplanmış, aranabilir hareket seçici. Yeni hareket de eklenebilir. */
export function ExercisePicker({ visible, onClose, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [version, setVersion] = useState(0); // yeni ekleyince listeyi tazele

  const exercises = useMemo(() => listExercises(), [version, visible]);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? exercises.filter(
          (e) => e.name.toLowerCase().includes(q) || e.muscle_group.toLowerCase().includes(q),
        )
      : exercises;
    const out: Row[] = [];
    let currentGroup = '';
    for (const ex of filtered) {
      if (ex.muscle_group !== currentGroup) {
        currentGroup = ex.muscle_group;
        out.push({ type: 'header', title: currentGroup });
      }
      out.push({ type: 'item', ex });
    }
    return out;
  }, [exercises, query]);

  const canCreate = query.trim().length > 1 && !exercises.some(
    (e) => e.name.toLowerCase() === query.trim().toLowerCase(),
  );

  const handleCreate = () => {
    const name = query.trim();
    const id = addExercise(name, 'Diğer');
    setQuery('');
    setVersion((v) => v + 1);
    onSelect(id, name);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={styles.topbar}>
            <T variant="title2">Hareket Seç</T>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <T variant="headline" color={colors.move}>
                Kapat
              </T>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.search}
            placeholder="Ara veya yeni hareket adı yaz…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
          />

          {canCreate && (
            <TouchableOpacity style={styles.createRow} onPress={handleCreate}>
              <T variant="headline" color={colors.move}>
                + “{query.trim()}” ekle
              </T>
            </TouchableOpacity>
          )}

          <FlatList
            data={rows}
            keyExtractor={(r, i) => (r.type === 'header' ? `h-${r.title}` : `e-${r.ex.id}`) + i}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: spacing.xxl }}
            renderItem={({ item }) =>
              item.type === 'header' ? (
                <T variant="footnote" style={styles.groupHeader}>
                  {item.title.toUpperCase()}
                </T>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.cardPressed }]}
                  onPress={() => {
                    onSelect(item.ex.id, item.ex.name);
                    onClose();
                  }}>
                  <T variant="body">{item.ex.name}</T>
                </Pressable>
              )
            }
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  search: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 17,
    marginBottom: spacing.sm,
  },
  createRow: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  groupHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  item: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
});
