import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import BMIRing from "../../../assets/DynamicSVGs/bmi";
import BmiCounter from "../../../assets/DynamicSVGs/bmiCounter";
import { BASE_URL } from "@/config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function bmiInfo() {
  const [bmi, setBMI] = useState(0);
  const getBMI = async () => {
    const token = await AsyncStorage.getItem("token");
    console.log("Token:",token);
    const res = await fetch(`${BASE_URL}/api/services/profile/getBMI`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Status:", res.status);

    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log(text);
    if (!res.ok) {
      return;
    }
    const data = JSON.parse(text);
    console.log(data);
    setBMI(data.bmi);
  };
  useEffect(() => {
    getBMI();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background justify-center items-center">
      <View className="relative">
        <BMIRing bmi={bmi} />
        <View className="absolute inset-0  items-center justify-center">
          <BmiCounter bmi={bmi} />
        </View>
      </View>
    </SafeAreaView>
  );
}
