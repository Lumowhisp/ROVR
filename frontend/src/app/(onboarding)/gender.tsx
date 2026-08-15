import { View } from "react-native";
import GenderCard from "./genderCard";

export default function GenderScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0A0A0F",
      }}
    >
      <GenderCard />
    </View>
  );
}