import { useState } from "react";
import { Pressable, TextInput, View, Text } from "react-native";
import { BASE_URL } from "@/config/api";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnBoard from "../screen/Onboard/onBoard";

type InputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
};

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
        backgroundColor: "#e2e2e2",
        width: "85%",
        paddingHorizontal: 16,
        marginVertical: 9,
        paddingVertical: 10,
        borderRadius: 10,
      }}
    />
  );
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPass] = useState("");
  const router = useRouter();
  const validate = () => {
    if (!name.trim()) {
      alert("Enter Name");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Valid Email");
      return false;
    }
    if (password.length < 6) {
      alert("Enter PassWord of >= 6 Char");
      return false;
    }
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    if (!strongPassword.test(password)) {
      alert(
        "Password must contain uppercase, lowercase, number and special character"
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
      await AsyncStorage.setItem("token", data.token);
      router.replace("/screen/Onboard/onBoard");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View className="flex-1 bg-primary justify-center items-center">
      <Input placeholder="Name" value={name} onChangeText={setName} />
      <Input placeholder="Email" value={email} onChangeText={setEmail} />
      <Input
        placeholder="Password"
        value={password}
        onChangeText={setPass}
        secureTextEntry={true}
      />
      <Pressable
        onPress={() => {
          console.log("Pressed");
          if (!validate()) {
            console.log("Validation Error");
            return;
          }
          handleSignUp();
          console.log("SignUp Handled");
        }}
        style={{
          backgroundColor: "#212020",
          paddingHorizontal: 20,
          paddingVertical: 13,
          borderRadius:10,
          marginTop:9
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 17 }}>Create Account</Text>
      </Pressable>
      <Pressable onPress={()=>{router.push("/Auth/signIn")}}
        style={{
          marginTop:10
        }}>
        <Text>
          Already User? Sign In
        </Text>
      </Pressable>
    </View>
  );
}
