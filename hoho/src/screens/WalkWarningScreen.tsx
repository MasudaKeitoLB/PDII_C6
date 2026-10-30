import EnemySprite from '../components/EnemySprite';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import ScrollingBackground from '../components/ScrollingBackground';
import HeroSprite from '../components/HeroSprite';
import { ATTACKS_PER_ENEMY, STEPS_PER_ATTACK } from '../game/levelTable';

export default function WalkWarningScreen({ sessionSteps }: { sessionSteps: number }) {
  const attacks = Math.floor(sessionSteps / STEPS_PER_ATTACK);
  const hpLeft = ATTACKS_PER_ENEMY - (attacks % ATTACKS_PER_ENEMY);
  const shake = useRef(new Animated.Value(0)).current;
  const prevAttacks = useRef(attacks);

  useEffect(() => {
    if (attacks === prevAttacks.current) return;
    prevAttacks.current = attacks;
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [attacks, shake]);

  return (
    <View style={styles.root}>
      <View style={styles.scene}>
        <ScrollingBackground moving />
        <View style={styles.hero}>
          <HeroSprite walking />
        </View>
        <Animated.View style={[styles.enemy, { transform: [{ translateX: shake }] }]}>
          <EnemySprite size={72} />
          <Text style={styles.hp}>{'❤️'.repeat(hpLeft)}</Text>
        </Animated.View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.title}>立ち止まってから{'\n'}ご覧ください</Text>
        <Text style={styles.sub}>歩いている間も、歩数はちゃんと記録されています</Text>
        <Text style={styles.steps}>今回の歩数：{sessionSteps} 歩</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scene: { height: 280, overflow: 'hidden' },
  hero: { position: 'absolute', left: 40, bottom: 70 },
  enemy: { position: 'absolute', right: 40, bottom: 70, alignItems: 'center' },
  enemyText: { fontSize: 56 },
  hp: { fontSize: 14 },
  panel: { flex: 1, backgroundColor: '#1b2040', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: '#fff', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  sub: { color: '#b8c0e0', fontSize: 14, textAlign: 'center' },
  steps: { color: '#fff', fontSize: 20 },
});