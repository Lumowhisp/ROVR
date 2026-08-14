import { Pressable, View, Text } from "react-native";

export default function CtaButton() {
  return (
    <>
      <View
        style={{
          borderWidth: 0,
          alignSelf: "center",
          paddingHorizontal: 10,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: "#DC2651",
        }}
      >
        <Pressable>
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
    </>
  );
}
