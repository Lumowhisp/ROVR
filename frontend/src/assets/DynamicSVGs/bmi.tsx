import Svg, { Circle } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

export default function BMIRing({ bmi }: { bmi: number }) {
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  const radius = 100;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.min(bmi / 40, 1);
  const offset = circumference * (1 - progress);

  const animatedOffset = useSharedValue(circumference);

  useEffect(() => {
    animatedOffset.value = withTiming(offset, {
      duration: 1500,
    });
  }, [offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));
  let color = "#22C55E";
  let status = "Normal";

  if (bmi < 18.5) {
    color = "#3B82F6";
    status = "Underweight";
  } else if (bmi < 25) {
    color = "#22C55E";
    status = "Normal";
  } else if (bmi < 30) {
    color = "#F59E0B";
    status = "Overweight";
  } else {
    color = "#EF4444";
    status = "Obese";
  }

  return (
    <Svg width={300} height={300}>
      <Circle
        cx="150"
        cy="150"
        r={radius}
        stroke="#333"
        strokeWidth={20}
        fill="none"
      />

      <AnimatedCircle
        cx="150"
        cy="150"
        r={radius}
        stroke={color}
        strokeWidth={20}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        rotation="-90"
        origin="150,150"
      />
    </Svg>
  );
}
