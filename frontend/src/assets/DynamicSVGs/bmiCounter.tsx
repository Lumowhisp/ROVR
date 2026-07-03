import { useEffect } from "react";
import { Text } from "react-native";
import Animated, { useAnimatedProps, useDerivedValue, useSharedValue, withTiming } from "react-native-reanimated"
import { TextInput } from "react-native"

export default function BmiCounter({ bmi }: { bmi: number }) {
    const bmiValue=useSharedValue(0);
    const derivedValue=useDerivedValue(()=>{
        return bmiValue.value.toFixed(1);
    })
    useEffect(() => {
        bmiValue.value = withTiming(bmi, {
            duration: 1500,
        });
    }, [bmi]);
    const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
    const animatedProps = useAnimatedProps(() => {
        return {
          text: derivedValue.value,
        };
      });
    
return (
    <AnimatedTextInput
    animatedProps={animatedProps}
    style={{
      color: "#ffffff",
      fontSize:40,
      fontFamily:"InterBold"
    }}
  />
)
}