import { StyleSheet, Text, TextProps } from 'react-native';
import { useGameStore } from '../state/gameStore';

// 普通のTextの代わりに使う。設定で「文字を大きくする」をオンにすると1.3倍になる
export default function AppText({ style, ...rest }: TextProps) {
  const big = useGameStore((s) => s.bigText);
  const size = (StyleSheet.flatten(style)?.fontSize ?? 16) * (big ? 1.3 : 1);
  return <Text {...rest} style={[style, { fontSize: size }]} />;
}