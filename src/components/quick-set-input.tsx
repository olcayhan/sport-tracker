import * as Haptics from 'expo-haptics';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import type { SetType } from '@/db/types';
import { colors, radius, spacing } from '@/theme';

import { T } from './ui';

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  step: number;
  suffix?: string;
  allowDecimal?: boolean;
}

/** +/- adımlı büyük numerik alan. */
function Stepper({ label, value, onChange, step, suffix, allowDecimal }: FieldProps) {
  const num = parseFloat((value || '0').replace(',', '.')) || 0;

  const bump = (dir: number) => {
    Haptics.selectionAsync();
    const next = Math.max(0, num + dir * step);
    onChange(allowDecimal ? String(next) : String(Math.round(next)));
  };

  return (
    <View style={styles.field}>
      <T variant="footnote" color={colors.textTertiary}>
        {label}
      </T>
      <View style={styles.stepperRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => bump(-1)} hitSlop={8}>
          <T variant="title2" color={colors.textSecondary}>
            −
          </T>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          keyboardType={allowDecimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          placeholder="0"
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity style={styles.stepBtn} onPress={() => bump(1)} hitSlop={8}>
          <T variant="title2" color={colors.textSecondary}>
            +
          </T>
        </TouchableOpacity>
      </View>
      {suffix ? (
        <T variant="caption" color={colors.textTertiary}>
          {suffix}
        </T>
      ) : null}
    </View>
  );
}

interface Props {
  reps: string;
  weight: string;
  onReps: (v: string) => void;
  onWeight: (v: string) => void;
  onCommit: () => void;
  label?: string;
  setType?: SetType;
  onToggleSetType?: () => void;
}

/** Tekrar + ağırlık girişi ve dev "Set Ekle" butonu (başarılı kayıtta haptic). */
export function QuickSetInput({
  reps,
  weight,
  onReps,
  onWeight,
  onCommit,
  label = 'Set Ekle',
  setType,
  onToggleSetType,
}: Props) {
  const handleCommit = () => {
    onCommit();
  };

  const isDropset = setType === 'dropset';

  return (
    <View>
      <View style={styles.fields}>
        <Stepper label="TEKRAR" value={reps} onChange={onReps} step={1} />
        <View style={styles.divider} />
        <Stepper
          label="AĞIRLIK"
          value={weight}
          onChange={onWeight}
          step={2.5}
          suffix="kg"
          allowDecimal
        />
      </View>

      {onToggleSetType && (
        <TouchableOpacity
          style={[styles.dropsetChip, isDropset && styles.dropsetChipActive]}
          onPress={() => {
            Haptics.selectionAsync();
            onToggleSetType();
          }}
          activeOpacity={0.8}>
          <T variant="subhead" color={isDropset ? colors.text : colors.textSecondary}>
            {isDropset ? '✓ Drop Set' : 'Drop Set'}
          </T>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.addBtn} onPress={handleCommit} activeOpacity={0.85}>
        <T variant="headline" color="#fff">
          {label}
        </T>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fields: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  field: { flex: 1, alignItems: 'center' },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.separator, marginVertical: spacing.sm },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minWidth: 64,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: colors.text,
  },
  addBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.move,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  dropsetChip: {
    marginTop: spacing.md,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.cardElevated,
  },
  dropsetChipActive: {
    backgroundColor: colors.purple,
  },
});
