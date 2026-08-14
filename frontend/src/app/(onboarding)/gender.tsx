import { View } from "react-native";
import Heading from "./heading";
import GenderCard from "./genderCard";

export default function GenderScreen() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Heading/>
      <GenderCard/>
    </View>
  );
}