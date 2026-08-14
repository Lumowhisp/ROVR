import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

export default function DateSelector() {
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  // const birthDay = date ? date.toISOString() : "DD/MM/YYYY";
  return (
    <View
      style={{
        borderWidth: 2,
        paddingVertical: 4,
        marginHorizontal: 50,
        alignItems: "center",
        borderRadius: 20,
        backgroundColor:"#FEBDC3",
        borderColor:"#FEBDc3"
      }}
    >
      <Pressable onPress={() => setShowPicker(true)}>
        <Text
          style={{
            fontSize: 40,
            color:"#DC2651"
          }}
        >
          {date ? date.toLocaleDateString() : "DD/MM/YYYY"}
        </Text>
        <View style={{alignItems:"center"}}>
          <Text
            style={{
              borderWidth: 0,
              borderRadius: 4,
              paddingVertical: 3,
              paddingHorizontal: 5,
              marginVertical: 10,
              backgroundColor:"#DC2651",
              color:"#ffffff",
              fontSize:20
            }}
          >
            Choose Date
          </Text>
        </View>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          value={date ?? new Date()}
          mode="date"
          display="spinner"
          onChange={handleChange}
        />
      )}
    </View>
  );
}
