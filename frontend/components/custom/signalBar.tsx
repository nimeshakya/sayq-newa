import { StyleSheet, View } from "react-native";
type BarInfo = {
  containerOutlineColor?: string;
  containerFillColor?: string;
  barBorderColor?: string;
  barFillColor?: string;
  signalWidth: number | string;
  signalHeight?: number | string;
};
type BarProps = {
  barInfo: BarInfo;
  strength: number;
  theme: { background: string; text: string };
};
export function SignalBar({ theme, strength, barInfo }: BarProps) {
  const styles = createStyle(barInfo, theme);
  return (
    <View style={styles.barContainer}>
      {[1, 2, 3, 4].map((index) => (
        <View
          key={`${index}-bar`}
          style={[
            styles.bars,
            { height: `${index * 25}%` },
            index <= strength ? styles.fill : null,
          ]}
        />
      ))}
    </View>
  );
}
function createStyle(
  barInfo: BarInfo["barInfo"],
  theme: { background: string; text: string }
) {
  return StyleSheet.create({
    barContainer: {
      flexDirection: "row",
      borderWidth: barInfo.containerOutlineColor ? 1 : 0,
      borderRadius: barInfo.containerOutlineColor ? 2 : 0,
      borderColor: barInfo.containerOutlineColor ?? theme.background,
      backgroundColor: barInfo.containerFillColor ?? theme.background,

      width: barInfo.signalWidth,
      height: barInfo.signalHeight ?? "100%",

      justifyContent: "center",
      alignItems: "flex-end",
      marginRight: 14,
    },
    bars: {
      borderColor: barInfo.barBorderColor ?? theme.text,
      borderWidth: 1,
      flex: 1,
    },
    fill: {
      backgroundColor: barInfo.barFillColor ?? theme.text,
    },
  });
}
