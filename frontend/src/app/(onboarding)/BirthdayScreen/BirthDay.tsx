import { View, Text } from "react-native";
import DateSelector from "./dataSelector";
import LottieView from "lottie-react-native";
import CtaButton from "./CTA";

const BG = "#FFD6DA";
export default function BirthDay() {
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
        <DateSelector />
        {/* <Text>Happy Birthday</Text> */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0 }}>
          <CtaButton />
        </View>
      </View>
    </>
  );
}
