import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface ThreeDotsLoaderProps {
  size?: number;
  color?: string;
  spacing?: number;
}

export default function ThreeDotsLoader({
  size = 6,
  color = '#767684',
  spacing = 4,
}: ThreeDotsLoaderProps) {
  const d1 = useRef(new Animated.Value(0.3)).current;
  const d2 = useRef(new Animated.Value(0.3)).current;
  const d3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      );

    const a1 = animate(d1, 0);
    const a2 = animate(d2, 150);
    const a3 = animate(d3, 300);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [d1, d2, d3]);

  const dotStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    marginHorizontal: spacing / 2,
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Animated.View style={[dotStyle, { opacity: d1 }]} />
      <Animated.View style={[dotStyle, { opacity: d2 }]} />
      <Animated.View style={[dotStyle, { opacity: d3 }]} />
    </View>
  );
}
