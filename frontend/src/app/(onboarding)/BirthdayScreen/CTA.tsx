import { Pressable, View, Text } from "react-native";

interface CtaButtonProps {
  onPress?: () => void;
  disabled?: boolean;
}

export default function CtaButton({ onPress, disabled }: CtaButtonProps) {
  return (
    <View
      style={{
        borderWidth: 0,
        alignSelf: "center",
        paddingHorizontal: 10,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#DC2651",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Pressable onPress={onPress} disabled={disabled}>
        <Text
          style={{
            fontSize: 20,
            paddingHorizontal: 90,
            color: "#ffffff",
          }}
        >
          Continue
        </Text>
      </Pressable>
    </View>
  );
}
