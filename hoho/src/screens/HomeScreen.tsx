import EnemySprite from '../components/EnemySprite';
import { StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import ProgressBar from '../components/ProgressBar';
import ScrollingBackground from '../components/ScrollingBackground';
import HeroSprite from '../components/HeroSprite';
import { useGameStore, todayKey } from '../state/gameStore';
import { expToNext } from '../game/levelTable';

export default function HomeScreen({ available }: { available: boolean | null }) {
  const { level, expInLevel, points, goal, nickname, history } = useGameStore();
  const need = expToNext(level);
  const today = history[todayKey()] ?? 0;
  const remain = Math.max(goal - today, 0);

  return (
    <View style={s.root}>
      <View style={s.scene}>
        <ScrollingBackground moving={false} />
        <View style={s.points}>
          <AppText style={s.pointsText}>🪙 {points}</AppText>
        </View>
        <View style={s.hero}>
          <HeroSprite walking={false} />
        </View>
        <View style={s.enemy}>
          <EnemySprite size={72} />
        </View>
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <AppText style={s.name}>{nickname}</AppText>
          <AppText style={s.lv}>レベル {level}</AppText>
        </View>
        <ProgressBar rate={expInLevel / need} color="#e3a72f" />
        <AppText style={s.sub}>次のレベルまで あと {(need - expInLevel).toLocaleString()} 歩</AppText>
      </View>

      <View style={s.card}>
        <AppText style={s.sub}>今日の目標まで あと</AppText>
        <AppText style={s.big}>{remain.toLocaleString()} 歩</AppText>
        <ProgressBar rate={today / goal} color="#2f7a3f" />
        <View style={s.row}>
          <AppText style={s.sub}>今日 {today.toLocaleString()} 歩</AppText>
          <AppText style={s.sub}>目標 {goal.toLocaleString()} 歩</AppText>
        </View>
      </View>

      {available === false && (
        <AppText style={s.warn}>歩数センサーが使えません（デバッグボタンで試せます）</AppText>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b2040' },
  scene: { height: 220, overflow: 'hidden' },
  points: { position: 'absolute', top: 12, right: 12, backgroundColor: '#1b2040', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  pointsText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  hero: { position: 'absolute', left: 40, bottom: 50 },
  enemy: { position: 'absolute', right: 50, bottom: 50 },
  card: { backgroundColor: '#fff', margin: 12, marginBottom: 0, padding: 16, borderRadius: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1b2040' },
  lv: { fontSize: 20, fontWeight: 'bold', color: '#c98a00' },
  sub: { fontSize: 15, color: '#555' },
  big: { fontSize: 44, fontWeight: 'bold', color: '#1b2040' },
  warn: { color: '#b8c0e0', fontSize: 13, textAlign: 'center', margin: 12 },
});