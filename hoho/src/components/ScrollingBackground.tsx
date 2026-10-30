import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

function Tile({ width }: { width: number }) {
  return (
    <View style={{ width, height: '100%' }}>
      <View style={styles.sky} />
      <View style={styles.ground} />
      <Text style={[styles.deco, { left: width * 0.15 }]}>🌲</Text>
      <Text style={[styles.deco, { left: width * 0.55 }]}>🌳</Text>
    </View>
  );
}

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
        toValue: -width,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [moving, width, x]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={{ flexDirection: 'row', width: width * 2, height: '100%', transform: [{ translateX: x }] }}
      >
        <Tile width={width} />
        <Tile width={width} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  sky: { flex: 0.7, backgroundColor: '#8fd3ff' },
  ground: { flex: 0.3, backgroundColor: '#5aa24a' },
  deco: { position: 'absolute', bottom: '28%', fontSize: 48 },
});