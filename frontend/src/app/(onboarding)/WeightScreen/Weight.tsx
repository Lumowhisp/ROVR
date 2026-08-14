import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import LottieView from "lottie-react-native";

const BG = "#C8F3E5";
const ACCENT = "#6C5CE7";

export default function WeightScreen() {
  const [weight, setWeight] = useState("");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: BG,
        alignItems: "center",
        paddingHorizontal: 24,
      }}
    >
      {/* Centered weighing machine */}
      <View
        style={{
          width: 300,
          height: 300,
          marginTop: 190,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LottieView
          source={require("@/assets/GenderScreenAssets/Weight.json")}
          autoPlay
          loop
          style={{
            width: 300,
            height: 300,
          }}
        />
      </View>

      {/* Weight input */}
      <View
        style={{
          width: "70%",
          height: 58,
          position: "relative",
          marginTop: 10,
        }}
      >
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder="Enter your weight"
          placeholderTextColor="#777"
          keyboardType="decimal-pad"
          style={{
            width: "100%",
            height: 58,
            backgroundColor: "white",
            borderRadius: 16,
            paddingHorizontal: 20,
            paddingRight: 55,
            fontSize: 20,
            textAlign: "center",
          }}
        />

        <Text
          style={{
            position: "absolute",
            right: 18,
            top: 18,
            fontSize: 16,
            color: "#555",
          }}
        >
          kg
        </Text>
      </View>

      {/* Continue button */}
      <Pressable
        disabled={!weight.trim()}
        style={{
          width: "100%",
          height: 56,
          borderRadius: 18,
          backgroundColor: ACCENT,
          justifyContent: "center",
          alignItems: "center",
          marginTop: "auto",
          marginBottom: 40,
          opacity: weight.trim() ? 1 : 0.5,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          Continue
        </Text>
      </Pressable>
    </View>
  );
}