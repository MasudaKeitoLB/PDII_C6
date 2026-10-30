import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function HeroSprite({ walking }: { walking: boolean }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!walking) {
      setFrame(0);
      return;
    }
    const id = setInterval(() => setFrame((f) => (f + 1) % 2), 250);
    return () => clearInterval(id);
  }, [walking]);

  return (
    <View style={{ transform: [{ translateY: frame === 0 ? 0 : -6 }] }}>
      <Text style={{ fontSize: 64 }}>🧑</Text>
    </View>
  );
}