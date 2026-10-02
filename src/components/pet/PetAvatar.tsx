import { useEffect } from 'react';
import { ImageSourcePropType, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type PetAvatarState = 'idle' | 'happy' | 'sick' | 'rainy' | 'care' | 'rest';

type Props = {
  source: ImageSourcePropType;
  state?: PetAvatarState;
  size?: number;
};

export function PetAvatar({ source, state = 'idle', size = 220 }: Props) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = 0;
    scale.value = 1;
    rotate.value = 0;

    switch (state) {
      case 'idle':
        translateY.value = withRepeat(
          withSequence(
            withTiming(-4, {
              duration: 1800,
              easing: Easing.inOut(Easing.ease),
            }),
            withTiming(0, {
              duration: 1800,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          false,
        );

        scale.value = withRepeat(
          withSequence(
            withTiming(1.015, {
              duration: 1800,
            }),
            withTiming(1, {
              duration: 1800,
            }),
          ),
          -1,
          false,
        );
        break;

      case 'happy':
        translateY.value = withRepeat(
          withSequence(
            withTiming(-10, {
              duration: 350,
            }),
            withTiming(0, {
              duration: 350,
            }),
          ),
          -1,
          false,
        );
        break;

      case 'sick':
        translateY.value = withRepeat(
          withSequence(
            withTiming(-2, {
              duration: 2500,
            }),
            withTiming(0, {
              duration: 2500,
            }),
          ),
          -1,
          false,
        );
        break;

      case 'rainy':
        rotate.value = withRepeat(
          withSequence(
            withTiming(-1.5, {
              duration: 1200,
            }),
            withTiming(1.5, {
              duration: 1200,
            }),
          ),
          -1,
          true,
        );
        break;

      case 'care':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.03, {
              duration: 900,
            }),
            withTiming(1, {
              duration: 900,
            }),
          ),
          -1,
          false,
        );
        break;

      case 'rest':
        scale.value = withRepeat(
          withSequence(
            withTiming(1.01, {
              duration: 3000,
            }),
            withTiming(1, {
              duration: 3000,
            }),
          ),
          -1,
          false,
        );
        break;
    }
  }, [rotate, scale, state, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: translateY.value,
      },
      {
        scale: scale.value,
      },
      {
        rotate: `${rotate.value}deg`,
      },
    ],
  }));

  return (
    <Animated.Image
      source={source}
      resizeMode="contain"
      style={[
        styles.image,
        {
          width: size,
          height: size,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
  },
});
