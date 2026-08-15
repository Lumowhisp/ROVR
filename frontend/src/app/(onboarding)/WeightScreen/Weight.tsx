import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import LottieView from "lottie-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { onboardAPI } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const BG = "#C8F3E5";
const ACCENT = "#6C5CE7";

export default function WeightScreen() {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuth();
  const { gender, dob, height } = useLocalSearchParams<{
    gender: string;
    dob: string;
    height: string;
  }>();

  const handleContinue = async () => {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight) || numWeight <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight in kg.");
      return;
    }

    setLoading(true);
    try {
      const res = await onboardAPI.submitProfile({
        weight: numWeight,
        height: parseFloat(height || "170"),
        gender: gender || "Male",
        dob: dob || undefined,
      });

      if (res.success) {
        await updateUser({
          isBMI: true,
          bmi: res.bmi,
          weight: numWeight,
          height: parseFloat(height || "170"),
          gender: gender || "Male",
        });

        router.push({
          pathname: "/(onboarding)/bmi-result" as any,
          params: {
            bmi: res.bmi.toString(),
          },
        });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to save profile. Please check your connection.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

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
          editable={!loading}
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
        disabled={!weight.trim() || loading}
        onPress={handleContinue}
        style={{
          width: "100%",
          height: 56,
          borderRadius: 18,
          backgroundColor: ACCENT,
          justifyContent: "center",
          alignItems: "center",
          marginTop: "auto",
          marginBottom: 40,
          opacity: weight.trim() && !loading ? 1 : 0.5,
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text
            style={{
              color: "white",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            Continue
          </Text>
        )}
      </Pressable>
    </View>
  );
}