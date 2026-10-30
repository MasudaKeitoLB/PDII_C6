import { Pressable, StyleSheet, View } from 'react-native';
import AppText from './AppText';

type Props = {
  label: string;
  value: number;
  unit: string;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
};

// 「−」「＋」ボタンで数字を変える部品
export default function Stepper({ label, value, unit, step, min, max, onChange }: Props) {
  return (
    <View style={styles.row}>
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.ctrl}>
        <Pressable style={styles.btn} onPress={() => onChange(Math.max(min, value - step))}>
          <AppText style={styles.btnText}>−</AppText>
        </Pressable>
        <AppText style={styles.value}>
          {value.toLocaleString()} {unit}
        </AppText>
        <Pressable style={styles.btn} onPress={() => onChange(Math.min(max, value + step))}>
          <AppText style={styles.btnText}>＋</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10, gap: 8 },
  label: { fontSize: 16, color: '#1b2040' },
  ctrl: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  btn: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#2f7a3f', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  value: { fontSize: 22, fontWeight: 'bold', color: '#1b2040' },
});