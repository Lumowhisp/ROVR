import { BASE_URL } from "@/config/api";
import React from "react";
import { useState } from "react";
import { Pressable, Text, TextInput, Touchable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
type InputType = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "numeric";
};
function Input({ placeholder, value, onChangeText, keyboardType }: InputType) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={{
        backgroundColor: "#e2e2e2",
        borderRadius: 5,
        paddingTop: 10,
        marginVertical: 6,
        marginHorizontal: 6,
      }}
      keyboardType={keyboardType}
    />
  );
}
export default function OnBoard() {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [gender, setGender] = useState("");

  const validate = () => {
    if (!weight.trim() || !height.trim() || !gender.trim()) {
      alert("Please Input all Fields");
      return;
    }
    const weightNum = Number(weight);
    if (isNaN(weightNum)) {
      alert("Weight must be a number");
      return;
    }
    if (weightNum < 10) {
      alert("Alert Are you Mad Weight < 10 ??");
      return;
    }
    return true;
  };
  const handleGetStarted = async () => {
    try {
      if (!validate()) {
        console.log("Validation Failed");
        return;
      }
      const token = await AsyncStorage.getItem("token");
      const weightNum = Number(weight);
      const heightNum = Number(height);

      const response = await fetch(`${BASE_URL}/api/onboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: weightNum,
          height: heightNum,
          gender,
        }),
      });
      if (!response.ok) {
        console.log("handleGetStarted Bugged");
        return;
      }
      router.replace("/screen/Onboard/screen2");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <SafeAreaView className="flex-1 bg-primary">
      <View className="flex-1 justify-center">
        <Text
          style={{
            fontFamily: "PlayfairBold",
            fontSize: 36,
            paddingHorizontal: 16,
            paddingTop: 16,
          }}
        >
          Quick Check In
        </Text>
        <View>
          <Input
            placeholder="Enter Weight (kg)"
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
          />
          <Input
            placeholder="Enter Height (cm)"
            value={height}
            onChangeText={setHeight}
            keyboardType="numeric"
          />
          <Picker
            selectedValue={gender}
            style={{
              backgroundColor: "#e2e2e2",
            }}
            onValueChange={(itemValue) => setGender(itemValue)}
          >
            <Picker.Item label="Select Gender" value="" />
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>
          <View
            className="justify-center items-center"
            style={{
              marginTop: 20,
            }}
          >
            <Pressable onPress={handleGetStarted}>
              <Text>Get Started</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
