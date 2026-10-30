import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View, useWindowDimensions } from 'react-native';

const BG = require('../../assets/bg.png');

export default function ScrollingBackground({ moving = true }: { moving?: boolean }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!moving) {
      x.stopAnimation();
      return;
    }
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -width * 2, // 「元・反転」の2枚ぶんを動くと元に戻る
        duration: 8000, // 小さいほど速く流れる
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [moving, width, x]);

  const tile = (flip: boolean, key: string) => (
    <Image
      key={key}
      source={BG}
      resizeMode="cover"
      fadeDuration={0}
      style={{ width, height: '100%', transform: [{ scaleX: flip ? -1 : 1 }] }}
    />
  );

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{ flexDirection: 'row', width: width * 3, height: '100%', transform: [{ translateX: x }] }}
      >
        {tile(false, 'a')}
        {tile(true, 'b')}
        {tile(false, 'c')}
      </Animated.View>
    </View>
  );
}