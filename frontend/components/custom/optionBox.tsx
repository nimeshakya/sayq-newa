import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
type OptionStyle = {
  selectedBoxColor?: string;
  boxColor?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: number;
};

type Options = {
  key: string;
  value: string;
};

type OptionProps = {
  optionInfo: OptionStyle;
  options: Options[];
  onSelect?: (item: Options) => void; //call back to parent
  theme: { background: string; text: string };
};

export function OptionBox({
  theme,
  options,
  optionInfo,
  onSelect,
}: OptionProps) {
  const styles = createStyle(optionInfo, theme);
  const [selectedItem, setSelectedItem] = useState("");
  return (
    <>
      <View style={styles.levelGroup}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedItem(item.key);
                onSelect?.(item); // notify parent}
              }}
              style={({ pressed }) => [
                styles.levelContainer,
                {
                  borderColor:
                    selectedItem === item.key
                      ? optionInfo.selectedBoxColor ?? "red"
                      : optionInfo.boxColor ?? theme.text,
                },
              ]}
            >
              <Text style={styles.text}>{item.value}</Text>
            </Pressable>
          )}
        ></FlatList>
      </View>
    </>
  );
}
function createStyle(
  optionInfo: OptionInfo["optionInfo"],
  theme: { background: string; text: string }
) {
  return StyleSheet.create({
    levelGroup: {
      flex: 1,
      width: "100%",
    },
    levelContainer: {
      marginHorizontal: 26,
      marginBottom: 26,
      padding: 14,
      borderRadius: 20,
      borderWidth: 1,
    },
    text: {
      color: optionInfo.color ?? theme.text,
      fontSize: optionInfo.fontSize ?? 16,
      fontWeight: optionInfo.fontWeight ?? 600,
    },
  });
}
