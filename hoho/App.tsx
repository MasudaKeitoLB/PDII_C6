import { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStepCounter } from './src/hooks/useStepCounter';
import { useWalkingState } from './src/hooks/useWalkingState';
import { useGameStore } from './src/state/gameStore';
import { calcBattle } from './src/game/levelTable';
import HomeScreen from './src/screens/HomeScreen';
import WalkWarningScreen from './src/screens/WalkWarningScreen';
import ResultScreen from './src/screens/ResultScreen';
import LevelUpScreen from './src/screens/LevelUpScreen';
import RecordScreen from './src/screens/RecordScreen';
import MeScreen from './src/screens/MeScreen';

type Phase = 'main' | 'warning' | 'result' | 'levelup';
type Tab = 'adventure' | 'record' | 'me';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'adventure', label: '冒険', icon: '🚩' },
  { key: 'record', label: '記録', icon: '📊' },
  { key: 'me', label: 'わたし', icon: '🙂' },
];

export default function App() {
  const { steps, available, addDebugSteps } = useStepCounter();
  const baseline = useRef(0); // 今回の冒険を始めた時点の歩数
  const [phase, setPhase] = useState<Phase>('main');
  const [tab, setTab] = useState<Tab>('adventure');

  const level = useGameStore((s) => s.level);
  const prevLevel = useGameStore((s) => s.prevLevel);
  const gain = useGameStore((s) => s.gain);

  const sessionSteps = steps - baseline.current;
  const battle = calcBattle(sessionSteps);

  // 止まってから10秒たったら成果画面へ
  const walking = useWalkingState(steps, () => setPhase('result'));

  // 歩き始めたら歩きスマホ防止画面へ（歩数は裏で数え続ける）
  useEffect(() => {
    if (walking && phase === 'main') setPhase('warning');
  }, [walking, phase]);

  // 「つづける」→ 経験値・ポイント・日ごとの歩数を保存 → レベルアップならその画面へ
  const onContinue = () => {
    gain(sessionSteps, battle.points);
    baseline.current = steps;
    const s = useGameStore.getState();
    setPhase(s.level > s.prevLevel ? 'levelup' : 'main');
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {phase === 'warning' && <WalkWarningScreen sessionSteps={sessionSteps} />}

      {phase === 'result' && (
        <ResultScreen
          sessionSteps={sessionSteps}
          defeated={battle.defeated}
          points={battle.points}
          onContinue={onContinue}
        />
      )}

      {phase === 'levelup' && (
        <LevelUpScreen from={prevLevel} to={level} onContinue={() => setPhase('main')} />
      )}

      {phase === 'main' && (
        <>
          <View style={styles.body}>
            {tab === 'adventure' && <HomeScreen available={available} />}
            {tab === 'record' && <RecordScreen />}
            {tab === 'me' && <MeScreen />}
          </View>

          <View style={styles.tabBar}>
            {TABS.map((t) => (
              <Pressable key={t.key} style={[styles.tabItem, tab === t.key && styles.tabOn]} onPress={() => setTab(t.key)}>
                <Text style={styles.tabIcon}>{t.icon}</Text>
                <Text style={[styles.tabLabel, tab === t.key && styles.tabLabelOn]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {/* 開発中だけ表示するデバッグボタン */}
      {__DEV__ && (
        <View style={styles.debug}>
          <Pressable style={styles.debugButton} onPress={() => addDebugSteps(10)}>
            <Text style={styles.debugText}>+10歩</Text>
          </Pressable>
          <Pressable style={styles.debugButton} onPress={() => addDebugSteps(500)}>
            <Text style={styles.debugText}>+500歩</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1b2040' },
  body: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#ddd' },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabOn: { backgroundColor: '#e5f1e6' },
  tabIcon: { fontSize: 24 },
  tabLabel: { fontSize: 15, color: '#555' },
  tabLabelOn: { color: '#2f7a3f', fontWeight: 'bold' },
  debug: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 8, backgroundColor: '#1b2040' },
  debugButton: { backgroundColor: '#444a70', padding: 10, borderRadius: 8 },
  debugText: { color: '#fff' },
});