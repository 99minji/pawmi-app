import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  size?: number;
};

const body = require('../../../assets/avatars/dog/pomeranian/idle-body.png');
const tail = require('../../../assets/avatars/dog/pomeranian/idle-tail.png');

export function AnimatedPetAvatar({ size = 220 }: Props) {
  const scaleX = useSharedValue(1);
  const scaleY = useSharedValue(1);
  const translateY = useSharedValue(0);
  const tailRotate = useSharedValue(0);

  useEffect(() => {
    // 숨쉬기 - 가로
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

    // 숨쉬기 - 세로
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

    // 아주 살짝 위아래 움직임
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

    // 꼬리 흔들기
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
        translateY: translateY.value,
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
      <Animated.Image
        source={tail}
        resizeMode="contain"
        style={[styles.tail, tailStyle]}
      />

      <Animated.Image
        source={body}
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
