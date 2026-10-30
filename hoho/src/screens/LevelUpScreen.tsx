import { Pressable, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';

export default function LevelUpScreen({ from, to, onContinue }: { from: number; to: number; onContinue: () => void }) {
  return (
    <View style={s.root}>
      <AppText style={s.star}>✨</AppText>
      <AppText style={s.title}>レベルアップ！</AppText>
      <AppText style={s.lv}>
        レベル {from} → {to}
      </AppText>
      <AppText style={s.sub}>ふだんの歩みが、冒険の力になっています</AppText>
      <Pressable style={s.button} onPress={onContinue}>
        <AppText style={s.buttonText}>つづける</AppText>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b2040', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  star: { fontSize: 64 },
  title: { color: '#ffd966', fontSize: 34, fontWeight: 'bold' },
  lv: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  sub: { color: '#b8c0e0', fontSize: 15, textAlign: 'center' },
  button: { backgroundColor: '#2f7a3f', alignSelf: 'stretch', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
});