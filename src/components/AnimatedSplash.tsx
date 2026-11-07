import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { fontFamily } from '@/ui/theme';

/**
 * The native splash (assets/images/splash-icon.png, 200 dp wide, centred) drawn again by the app and animated, so the
 * hand-off is invisible: the native splash is hidden on the first frame of this copy, the heart beats twice with a ripple
 * while the app restores the session, then the splash lifts and fades away. With Reduce Motion it only fades.
 *
 * The geometry mirrors the generated image (1200 px canvas shown at 200 dp): heart 69.3 dp wide centred 83.3 dp from the
 * top, "MyHealth" in Figtree ExtraBold 28 dp below it. Colours follow the device scheme, as the native splash does.
 */
const BOX = 200;
const HEART = 69.3;
const HEART_CY = 83.3;
const WORD_TOP = 141;
const MIN_SHOW_MS = 1100;

const HEART_PATH =
  'M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5';
const PULSE_PATH = 'M3.22 13H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27';

export function AnimatedSplash({ ready, onDone }: { ready: boolean; onDone: () => void }) {
  const dark = useColorScheme() === 'dark';
  const reduceMotion = useReducedMotion();
  const [shownAt] = useState(() => Date.now());
  const hidNative = useRef(false);

  const beat = useSharedValue(1);
  const ripple = useSharedValue(0);
  const exit = useSharedValue(0);

  // Hide the native splash once this copy is on screen (its first layout), so nothing flickers between the two.
  const onFirstLayout = () => {
    if (hidNative.current) return;
    hidNative.current = true;
    void SplashScreen.hideAsync().catch(() => undefined);
    if (reduceMotion) return;
    // Two heartbeats a second, with a ripple on each, for as long as the splash is up.
    const lub = withSequence(
      withTiming(1.14, { duration: 130, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 150, easing: Easing.in(Easing.quad) }),
      withTiming(1.08, { duration: 110, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 260, easing: Easing.inOut(Easing.quad) }),
      withTiming(1, { duration: 350 }),
    );
    beat.value = withDelay(120, withRepeat(lub, -1));
    ripple.value = withDelay(120, withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) })), -1));
  };

  // Leave once the app is ready and the splash has been seen long enough to read as intended, not as a flash.
  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(0, (reduceMotion ? 300 : MIN_SHOW_MS) - (Date.now() - shownAt));
    const timer = setTimeout(() => {
      exit.value = withTiming(1, { duration: reduceMotion ? 200 : 420, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onDone)();
      });
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, reduceMotion, shownAt, exit, onDone]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: 1 - exit.value }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -14 * exit.value }, { scale: 1 + 0.06 * exit.value }],
  }));
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.32 * (1 - ripple.value),
    transform: [{ scale: 0.7 + 0.9 * ripple.value }],
  }));

  return (
    <Animated.View
      pointerEvents={ready ? 'none' : 'auto'}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Opening MyHealth"
      style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: dark ? '#0D1A1F' : '#1E7A8C' }, overlayStyle]}
      onLayout={onFirstLayout}>
      <Animated.View style={[styles.box, contentStyle]}>
        {reduceMotion ? null : <Animated.View style={[styles.ripple, rippleStyle]} />}
        <Animated.View style={[styles.heart, heartStyle]}>
          <Svg width={HEART} height={HEART} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <Path d={HEART_PATH} />
            <Path d={PULSE_PATH} />
          </Svg>
        </Animated.View>
        <Text allowFontScaling={false} style={styles.word}>
          MyHealth
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const RIPPLE = HEART * 1.5;

const styles = StyleSheet.create({
  overlay: { zIndex: 1000, alignItems: 'center', justifyContent: 'center' },
  box: { width: BOX, height: BOX },
  heart: { position: 'absolute', left: (BOX - HEART) / 2, top: HEART_CY - HEART / 2, width: HEART, height: HEART },
  ripple: {
    position: 'absolute',
    left: (BOX - RIPPLE) / 2,
    top: HEART_CY - RIPPLE / 2,
    width: RIPPLE,
    height: RIPPLE,
    borderRadius: RIPPLE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  word: {
    position: 'absolute',
    top: WORD_TOP,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFFFFF',
    fontFamily: fontFamily[800],
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: 0,
  },
});
