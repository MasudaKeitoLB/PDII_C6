import { Image } from 'react-native';

export default function EnemySprite({ size = 72 }: { size?: number }) {
  return (
    <Image
      source={require('../../assets/enemy.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      fadeDuration={0}
    />
  );
}