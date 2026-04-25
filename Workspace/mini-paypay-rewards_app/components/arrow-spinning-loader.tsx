import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface ArrowSpinningLoaderProps {
  size?: number;
  color?: string;
}

export default function ArrowSpinningLoader({
  size = 14,
  color = '#767684',
}: ArrowSpinningLoaderProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Ionicons name="refresh" size={size} color={color} />
    </Animated.View>
  );
}
