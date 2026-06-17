import { useState } from "react";
import { Pressable, TextInput, View, Text } from "react-native";
import { BASE_URL } from "@/config/api";
import { useRouter } from "expo-router";

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
    />
  );
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPass] = useState("");
  const router = useRouter();
  const validate = () => {
    if(!name.trim()){
        alert("Enter Name");
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
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
      router.replace("/Auth/signIn");
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <View className="flex-1 bg-primary justify-center items-center">
      <Input placeholder="Name" value={name} onChangeText={setName} />
      <Input placeholder="Email" value={email} onChangeText={setEmail} />
      <Input placeholder="Password" value={password} onChangeText={setPass} />
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
      >
        <Text>Create Account</Text>
      </Pressable>
    </View>
  );
}
