import { Text, TextInput, View, Pressable } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "@/config/api";
import { router } from "expo-router";
type InputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};
//secureTextEntry :: Hide Password
function Input({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
}: InputProps) {
  return (
    <TextInput
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      style={{
        width: "85%",
        height: 50,
        backgroundColor: "#e2e2e2",
        borderRadius: 12,
        paddingHorizontal: 16,
        marginVertical: 8,
      }}
    />
  );
}

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      if (!response.ok) {
        throw new Error("Login Failed");
      }
      const data = await response.json();
      console.log(data);
      await AsyncStorage.setItem("token", data.token);
      console.log("Email:", email);
      console.log("Password:", password);
      console.log("Base URL:", BASE_URL);
      console.log("Logged In");
    } catch (error) {
      console.log(error);
      console.log(BASE_URL);
    }
  };
  return (
    <View className="bg-primary flex-1 justify-center items-center">
      <Input placeholder="Email" value={email} onChangeText={setEmail} />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
      />
      <Pressable
        onPress={() => {
          console.log("Button Pressed");
          handleSignIn();
        }}
        style={{
          width: "85%",
          height: 50,
          backgroundColor: "#212020",
          borderRadius: 12,
          paddingHorizontal: 16,
          marginVertical: 8,
        }}
        className="flex justify-center items-center"
      >
        <Text style={{
          color:"#ffffff"
        }}>Sign In</Text>
      </Pressable>
      <Pressable onPress={()=>{
        router.push('/Auth/signUp')
      }}
      style={{
        marginTop:10
      }}>
        <Text>
          New User? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}
