import { useEffect, useState } from 'react';
import { Image, View } from 'react-native';

const FRAMES = [require('../../assets/hero1.png'), require('../../assets/hero2.png')];
const SIZE = 96; // 表示する大きさ。大きくしたいときはここを変える

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
    <View style={{ transform: [{ translateY: walking && frame === 1 ? -4 : 0 }] }}>
      <Image source={FRAMES[frame]} style={{ width: SIZE, height: SIZE }} resizeMode="contain" fadeDuration={0} />
    </View>
  );
}