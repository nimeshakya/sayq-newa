import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { SignalBar } from "./signalBar";
import { Colors } from "@/constants/theme";

import { useOption } from "@/context/optionContext";

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
  type?: string;
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
};

export function OptionBox({ options, optionInfo }: OptionProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;

  const styles = createStyle(optionInfo, theme);

  const barInfo = {
    signalWidth: 26,
    signalHeight: 23,
  };

  const { setOption, option } = useOption(); //to set selected item

  return (
    <>
      <View style={styles.optionsGroup}>
        <FlatList
          data={options}
          keyExtractor={(item) => item.key}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setOption(item);
              }}
              style={({ pressed }) => [
                styles.optionsContainer,
                {
                  borderColor:
                    option?.key === item.key
                      ? optionInfo.selectedBoxColor ?? "red"
                      : optionInfo.boxColor ?? theme.text,
                },
              ]}
            >
              {item.keyword && item.icon ? (
                <View style={styles.selector}>
                  <SignalBar
                    theme={theme}
                    barInfo={barInfo}
                    strength={Number(item.key) - 1}
                  />
                  <Text style={styles.textStyle}>{item.value}</Text>
                  <Text style={styles.keywordStyle}>{item.keyword}</Text>
                </View>
              ) : item.keyword && !item.icon ? (
                <View style={styles.selector}>
                  <Text style={styles.textStyle}>{item.value}</Text>
                  <Text style={styles.keywordStyle}>{item.keyword}</Text>
                </View>
              ) : !item.keyword && item.icon ? (
                <View style={styles.selector}>
                  <SignalBar
                    theme={theme}
                    barInfo={barInfo}
                    strength={Number(item.key) - 1}
                  />
                  <Text style={styles.textStyle}>{item.value}</Text>
                </View>
              ) : (
                <View style={styles.selector}>
                  <Text style={styles.textStyle}>{item.value}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      </View>
    </>
  );
}
import { ViewStyle, TextStyle } from "react-native";

function createStyle(
  optionInfo: OptionStyle,
  theme: { background: string; text: string }
) {
  return StyleSheet.create({
    optionsGroup: {
      flex: 1,
      width: "100%",
    },
    optionsContainer: {
      marginHorizontal: 26,
      marginBottom: 26,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      backgroundColor: optionInfo.boxColor ?? undefined,
    },
    selector: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
    },
    textStyle: {
      flex: 1,
      color: optionInfo.color ?? theme.text,
      fontSize: optionInfo.fontSize ?? 16,
      fontWeight: (optionInfo.fontWeight as TextStyle["fontWeight"]) ?? "600",
      flexWrap: "wrap",
    },
    keywordStyle: {
      color: optionInfo.color ?? theme.text,
      fontSize: optionInfo.keywordFontSize ?? 16,
      fontWeight:
        (optionInfo.keywordFontWeight as TextStyle["fontWeight"]) ?? "600",
      width: 70, // fixed width for keyword
      textAlign: "right",
    },
  });
}
