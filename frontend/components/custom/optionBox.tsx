import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SignalBar } from "./signalBar";
type OptionStyle = {
  selectedBoxColor?: string;
  boxColor?: string;
  color?: string;
  optionFillColor?: string;
  optionOutlineColor?: string;
  fontSize?: number;
  fontWeight?: number;
  keywordFontSize?: number;
  keywordFontWeight?: number;
};

type Options = {
  key: string;
  value: string;
  keyword?: string;
  icon?: string;
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
  const [strength, setStrenth] = useState();

  const barInfo = {
    signalWidth: 26,
    signalHeight: 23,
  };

  return (
    <>
      <View style={styles.levelGroup}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              key={item.key}
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
              {item.keyword && item.icon ? (
                <View key={item.key} style={styles.selector}>
                  <SignalBar
                    key={`${item.key}-signal`}
                    theme={theme}
                    barInfo={barInfo}
                    strength={Number(item.key) - 1}
                  />
                  <Text key={`${item.key}-value`} style={styles.textStyle}>
                    {item.value}
                  </Text>
                  <Text key={`${item.key}-keyword`} style={styles.keywordStyle}>
                    {item.keyword}
                  </Text>
                </View>
              ) : item.keyword && !item.icon ? (
                <View key={item.key} style={styles.selector}>
                  <Text key={`${item.key}-value`} style={styles.textStyle}>
                    {item.value}
                  </Text>
                  <Text key={`${item.key}-keyword`} style={styles.keywordStyle}>
                    {item.keyword}
                  </Text>
                </View>
              ) : !item.keyword && item.icon ? (
                <View key={item.key} style={styles.selector}>
                  <SignalBar
                    key={`${item.key}-signal`}
                    theme={theme}
                    barInfo={barInfo}
                    strength={Number(item.key) - 1}
                  />
                  <Text key={`${item.key}-value`} style={styles.textStyle}>
                    {item.value}
                  </Text>
                </View>
              ) : (
                <Text key={`${item.key}-value`} style={styles.textStyle}>
                  {item.value}
                </Text>
              )}
            </Pressable>
          )}
        />
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
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: optionInfo.color ?? null,
    },
    selector: {
      flexDirection: "row",
      alignItems: "center",
    },
    textStyle: {
      flex: 1,
      color: optionInfo.color ?? theme.text,
      fontSize: optionInfo.fontSize ?? 16,
      fontWeight: optionInfo.fontWeight ?? 600,
      flexWrap: "wrap",
      marginVertical: 14,
    },
    keywordStyle: {
      color: optionInfo.color ?? theme.text,
      fontSize: optionInfo.keywordFontSize ?? 16,
      fontWeight: optionInfo.keywordFontWeight ?? 600,
      width: 70, // fixed width for keyword
      textAlign: "right",
    },
  });
}
