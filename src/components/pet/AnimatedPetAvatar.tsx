import { useEffect } from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type AvatarReaction = 'idle' | 'happy' | 'care';

type Props = {
  size?: number;
  source: ImageSourcePropType;
  tailSource?: ImageSourcePropType;
  reaction?: AvatarReaction;
};

export function AnimatedPetAvatar({
  size = 220,
  source,
  tailSource,
  reaction = 'idle',
}: Props) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const translateY = useSharedValue(0);
  const tailRotate = useSharedValue(0);
  const bounceY = useSharedValue(0);

  // care 반응
  useEffect(() => {
    if (reaction !== 'care') {
      bounceY.value = 0;
      return;
    }

    bounceY.value = withSequence(
      withTiming(-14, {
        duration: 180,
        easing: Easing.out(Easing.ease),
      }),
      withTiming(0, {
        duration: 220,
        easing: Easing.in(Easing.ease),
      }),
      withTiming(-7, {
        duration: 130,
      }),
      withTiming(0, {
        duration: 160,
      }),
    );
  }, [bounceY, reaction]);

  // 기본 idle 애니메이션
  useEffect(() => {
    scaleX.value = withRepeat(
      withSequence(
        withTiming(1.015, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    scaleY.value = withRepeat(
      withSequence(
        withTiming(1.03, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(1, {
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    );

    translateY.value = withRepeat(
      withSequence(
        withTiming(-3, {
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

    // 꼬리 파츠가 있을 때만 실제 화면에 보임
    tailRotate.value = withRepeat(
      withSequence(
        withTiming(-7, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(7, {
          duration: 700,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      true,
    );
  }, [scaleX, scaleY, translateY, tailRotate]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: translateY.value + bounceY.value,
      },
      {
        scaleX: scaleX.value,
      },
      {
        scaleY: scaleY.value,
      },
    ],
  }));

  const tailStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${tailRotate.value}deg`,
      },
    ],
  }));

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
        },
      ]}
    >
      {tailSource && (
        <Animated.Image
          source={tailSource}
          resizeMode="contain"
          style={[styles.tail, tailStyle]}
        />
      )}

      <Animated.Image
        source={source}
        resizeMode="contain"
        style={[styles.body, breathingStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
  },

  tail: {
    position: 'absolute',
    width: '42%',
    height: '42%',
    right: '2%',
    top: '34%',
    zIndex: 1,
  },
});
