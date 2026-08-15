import { View } from "react-native";
import DateSelector from "./dataSelector";
import LottieView from "lottie-react-native";
import CtaButton from "./CTA";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

const BG = "#FFD6DA";
export default function BirthDay() {
  const [date, setDate] = useState<Date | null>(null);
  const router = useRouter();
  const { gender } = useLocalSearchParams<{ gender: string }>();

  const handleContinue = () => {
    router.push({
      pathname: "/(onboarding)/HeightScreen/heightCard",
      params: {
        gender: gender || "",
        dob: date ? date.toISOString() : "",
      },
    });
  };

  return (
    <>
      <View style={{ backgroundColor: BG, flex: 1, justifyContent: "center" }}>
        <View
          style={{
            alignItems: "center",
          }}
        >
          <LottieView
            source={require("../../../../assets/GenderScreenAssets/cake.json")}
            autoPlay
            loop
            style={{
              width: 240,
              height: 240,
            }}
          />
        </View>
        <DateSelector date={date} onDateChange={setDate} />
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0 }}>
          <CtaButton onPress={handleContinue} disabled={!date} />
        </View>
      </View>
    </>
  );
}
