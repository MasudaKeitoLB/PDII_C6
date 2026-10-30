import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import AppText from '../components/AppText';
import Stepper from '../components/Stepper';
import { useGameStore } from '../state/gameStore';

export default function MeScreen() {
  const { nickname, goal, heightCm, weightKg, bigText, update } = useGameStore();

  return (
    <ScrollView contentContainerStyle={s.root}>
      <AppText style={s.title}>わたし</AppText>

      <View style={s.card}>
        <AppText style={s.label}>ニックネーム</AppText>
        <TextInput value={nickname} onChangeText={(t) => update({ nickname: t })} maxLength={10} style={s.input} />
      </View>

      <View style={s.card}>
        <Stepper label="1日の目標歩数" value={goal} unit="歩" step={500} min={1000} max={20000} onChange={(v) => update({ goal: v })} />
        <Stepper label="身長" value={heightCm} unit="cm" step={1} min={100} max={220} onChange={(v) => update({ heightCm: v })} />
        <Stepper label="体重" value={weightKg} unit="kg" step={1} min={30} max={150} onChange={(v) => update({ weightKg: v })} />
      </View>

      <View style={[s.card, s.switchRow]}>
        <AppText style={s.label}>文字を大きくする</AppText>
        <Switch value={bigText} onValueChange={(v) => update({ bigText: v })} />
      </View>

      {__DEV__ && (
        <Pressable
          style={s.reset}
          onPress={() => useGameStore.setState({ level: 1, expInLevel: 0, prevLevel: 1, points: 0, history: {} })}
        >
          <AppText style={s.resetText}>（開発用）データを初期化</AppText>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { padding: 12, gap: 12, backgroundColor: '#f3f0e6', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1b2040' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14 },
  label: { fontSize: 16, color: '#1b2040' },
  input: { marginTop: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, fontSize: 20 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reset: { padding: 14, alignItems: 'center' },
  resetText: { color: '#999', fontSize: 14 },
});