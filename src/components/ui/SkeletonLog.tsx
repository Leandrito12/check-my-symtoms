import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { SafeHarbor } from '@/constants/SafeHarbor';

export function SkeletonLog() {
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, useNativeDriver: true, duration: 600 }),
        Animated.timing(opacity, { toValue: 0.4, useNativeDriver: true, duration: 600 }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, styles.logCard, { opacity }]} />
      <Animated.View style={[styles.card, styles.commentCard, { opacity }]} />
      <Animated.View style={[styles.card, styles.commentCard, { opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  card: {
    backgroundColor: SafeHarbor.colors.border,
    borderRadius: SafeHarbor.spacing.cardRadius,
  },
  logCard: { height: 200 },
  commentCard: { height: 80 },
});
