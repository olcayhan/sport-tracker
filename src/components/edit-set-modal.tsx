import { Alert, Modal, Pressable, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SetType } from '@/db/types';
import { colors, radius, spacing } from '@/theme';

import { QuickSetInput } from './quick-set-input';
import { T } from './ui';

interface Props {
  visible: boolean;
  exerciseName: string;
  reps: string;
  weight: string;
  onReps: (v: string) => void;
  onWeight: (v: string) => void;
  setType: SetType;
  onToggleSetType: () => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Var olan bir seti düzenlemek için ekranın yarısını kaplayan alt sayfa. */
export function EditSetModal({
  visible,
  exerciseName,
  reps,
  weight,
  onReps,
  onWeight,
  setType,
  onToggleSetType,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const confirmDelete = () => {
    Alert.alert('Seti sil', 'Bu set silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />

        <View
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingHorizontal: spacing.lg,
          }}>
          <SafeAreaView edges={['bottom']}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: spacing.md,
              }}>
              <T variant="title2" numberOfLines={1} style={{ flex: 1, marginRight: spacing.md }}>
                {exerciseName}
              </T>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <T variant="headline" color={colors.move}>
                  Kapat
                </T>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <QuickSetInput
                reps={reps}
                weight={weight}
                onReps={onReps}
                onWeight={onWeight}
                onCommit={onSave}
                label="Kaydet"
                setType={setType}
                onToggleSetType={onToggleSetType}
              />
            </View>

            <TouchableOpacity
              style={{ marginTop: spacing.lg, alignItems: 'center' }}
              onPress={confirmDelete}>
              <T variant="headline" color={colors.move}>
                Seti Sil
              </T>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
