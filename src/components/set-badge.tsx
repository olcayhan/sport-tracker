import * as Haptics from 'expo-haptics';
import { TouchableOpacity, View } from 'react-native';

import type { SetType } from '@/db/types';
import { colors, radius } from '@/theme';

import { T } from './ui';

interface Props {
  setNumber: number;
  setType: SetType;
  onPress?: () => void;
}

/** Set numarası rozeti. Drop set ise mor vurgu. onPress verilirse dokunulabilir (tip döngüsü). */
export function SetBadge({ setNumber, setType, onPress }: Props) {
  const isDropset = setType === 'dropset';
  const content = (
    <View
      style={{
        width: 28,
        height: 28,
        borderRadius: radius.pill,
        backgroundColor: isDropset ? colors.purple : colors.cardElevated,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <T variant="footnote" color={isDropset ? colors.text : colors.textSecondary}>
        {setNumber}
      </T>
    </View>
  );

  if (!onPress) return content;

  return (
    <TouchableOpacity
      hitSlop={8}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}>
      {content}
    </TouchableOpacity>
  );
}
