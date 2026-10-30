import { View } from 'react-native';

export default function ProgressBar({ rate, color }: { rate: number; color: string }) {
  const r = Math.min(Math.max(rate, 0), 1);
  return (
    <View style={{ height: 14, borderRadius: 7, backgroundColor: '#ddd6c3', overflow: 'hidden', flexDirection: 'row' }}>
      <View style={{ flex: r, backgroundColor: color }} />
      <View style={{ flex: 1 - r }} />
    </View>
  );
}