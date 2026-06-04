/**
 * Renders the loading screen in the mobile app.
 * It composes UI components, hooks and API/store data for this route.
 */

import { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '../src/hooks/useTheme';
import { Logo } from '../src/components/brand/Logo';

export default function LoadingScreen() {
  const { colors } = useTheme();

  // Animación de pulso
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withSpring(1.08, { damping: 6 }),
        withSpring(1, { damping: 6 }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );

    // Navegar tras 2.5 s
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
    >
      <Animated.View style={logoStyle}>
        <Logo size="xl" />
      </Animated.View>

      <Text
        style={{
          fontFamily: 'BebasNeue_400Regular',
          fontSize: 28,
          color: colors.accent,
          letterSpacing: 3,
        }}
      >
        PERREO FC
      </Text>

      <Text
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: 14,
          color: colors.textMuted,
          marginTop: -8,
        }}
      >
        Cargando...
      </Text>
    </View>
  );
}
