import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import AppText from '../components/AppText';
import { dateKey, todayKey, useGameStore } from '../state/gameStore';
import { distanceKm, kcal } from '../game/health';

// 今日から n 日ぶんの日付を、古い順に返す
function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(dateKey(d));
  }
  return out;
}

export default function RecordScreen() {
  const { history, goal, heightCm, weightKg } = useGameStore();
  const [range, setRange] = useState<7 | 30>(7);

  const days = lastDays(range);
  const values = days.map((k) => history[k] ?? 0);
  const today = history[todayKey()] ?? 0;
  const max = Math.max(goal, ...values, 1);
  const H = 140;

  return (
    <ScrollView contentContainerStyle={s.root}>
      <AppText style={s.title}>記録</AppText>

      <View style={s.card}>
        <AppText style={s.sub}>今日の歩数</AppText>
        <AppText style={s.big}>{today.toLocaleString()} 歩</AppText>
        <View style={s.row}>
          <AppText style={s.sub}>距離 {distanceKm(today, heightCm).toFixed(1)} km</AppText>
          <AppText style={s.sub}>消費 {Math.round(kcal(today, heightCm, weightKg))} kcal</AppText>
        </View>
      </View>

      <View style={s.card}>
        <View style={s.tabs}>
          {([7, 30] as const).map((r) => (
            <Pressable key={r} style={[s.tab, range === r && s.tabOn]} onPress={() => setRange(r)}>
              <AppText style={[s.tabText, range === r && s.tabTextOn]}>{r === 7 ? '1週間' : '1か月'}</AppText>
            </Pressable>
          ))}
        </View>

        <View style={{ height: H, flexDirection: 'row', alignItems: 'flex-end', gap: range === 7 ? 8 : 2 }}>
          {values.map((v, i) => (
            <View
              key={days[i]}
              style={{ flex: 1, height: Math.max((v / max) * H, 2), backgroundColor: '#2f7a3f', borderRadius: 3 }}
            />
          ))}
          {/* 目標のライン */}
          <View
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, bottom: (goal / max) * H, borderTopWidth: 1.5, borderColor: '#d9534f', borderStyle: 'dashed' }}
          />
        </View>
        <View style={s.row}>
          <AppText style={s.small}>{days[0].slice(5)}</AppText>
          <AppText style={s.small}>赤い線 = 目標 {goal.toLocaleString()} 歩</AppText>
          <AppText style={s.small}>{days[days.length - 1].slice(5)}</AppText>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { padding: 12, gap: 12, backgroundColor: '#f3f0e6', flexGrow: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1b2040' },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  sub: { fontSize: 15, color: '#555' },
  small: { fontSize: 12, color: '#777' },
  big: { fontSize: 40, fontWeight: 'bold', color: '#1b2040' },
  tabs: { flexDirection: 'row', gap: 8 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#ece7d6', alignItems: 'center' },
  tabOn: { backgroundColor: '#2f7a3f' },
  tabText: { fontSize: 16, color: '#1b2040' },
  tabTextOn: { color: '#fff', fontWeight: 'bold' },
});