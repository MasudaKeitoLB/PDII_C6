import { Pressable, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';

type Props = {
  sessionSteps: number;
  defeated: number;
  points: number;
  onContinue: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <AppText style={s.label}>{label}</AppText>
      <AppText style={s.value}>{value}</AppText>
    </View>
  );
}

export default function ResultScreen({ sessionSteps, defeated, points, onContinue }: Props) {
  return (
    <View style={s.root}>
      <AppText style={s.title}>おかえりなさい！</AppText>
      <AppText style={s.sub}>歩いた分の冒険の成果です</AppText>
      <View style={s.card}>
        <Row label="歩いた歩数" value={`${sessionSteps.toLocaleString()} 歩`} />
        <Row label="倒した敵" value={`${defeated} 体`} />
        <Row label="経験値" value={`+${sessionSteps.toLocaleString()}`} />
        <Row label="ポイント" value={`+${points}`} />
      </View>
      <Pressable style={s.button} onPress={onContinue}>
        <AppText style={s.buttonText}>つづける</AppText>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b2040', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  sub: { color: '#b8c0e0', fontSize: 15 },
  card: { backgroundColor: '#fff', alignSelf: 'stretch', padding: 16, borderRadius: 14, gap: 12, marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 18, color: '#555' },
  value: { fontSize: 20, fontWeight: 'bold', color: '#1b2040' },
  button: { backgroundColor: '#2f7a3f', alignSelf: 'stretch', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
});