import { Colors } from "@/constants/theme";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, useColorScheme } from "react-native";
import { TextStyle, ViewStyle } from "react-native";

type ButtonInfo = {
  backgroundColor?: string;

  height?: number | string;
  width?: number | string;

  padding?: number | string;
  paddingVertical?: number | string;
  paddingHorizontal?: number | string;

  margin?: number | string;
  marginVertical?: number | string;
  marginHorizontal?: number | string;
  marginTop?: number | string;
  marginBottom?: number | string;

  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: number;

  color?: string;
  fontSize?: number;
  fontWeight?: number | string;
};

type NavButtonProps = {
  buttonInfo: ButtonInfo;
  text: string;
  link?: string;
  onPress?: () => void;
};

export function NavButton({ buttonInfo, link, text, onPress }: NavButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyle(
    buttonInfo,
    theme ?? { background: "#fff", text: "#000" }
  );
  if (link) {
    // navigation version
    return (
      <Link href={link as any} asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{text}</Text>
        </Pressable>
      </Link>
    );
  }

  // non-navigation version
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}
function createStyle(
  buttonInfo: ButtonInfo,
  theme: { background: string; text: string; colorText: string }
) {
  return StyleSheet.create({
    button: {
      backgroundColor: buttonInfo.backgroundColor ?? theme.colorText,

      justifyContent: "center",
      alignItems: "center",
      alignContent: "center",

      width: buttonInfo.width ?? "auto",
      height: buttonInfo.height ?? "auto",

      padding: buttonInfo.padding ?? 0,
      paddingHorizontal: buttonInfo.paddingHorizontal ?? 20,
      paddingVertical: buttonInfo.paddingVertical ?? 5,

      margin: buttonInfo.margin ?? 0,
      marginHorizontal: buttonInfo.marginHorizontal ?? "auto",
      marginVertical: buttonInfo.marginVertical ?? 0,
      marginTop: buttonInfo.marginTop ?? 20,
      marginBottom: buttonInfo.marginBottom ?? 0,

      borderRadius: buttonInfo.borderRadius ?? 10,
      borderWidth: buttonInfo.borderWidth ?? 1,
      borderStyle: buttonInfo.borderStyle ?? "solid",
      borderColor: buttonInfo.borderColor ?? "transparent",
    } as ViewStyle,
    buttonText: {
      color: buttonInfo.color ?? theme.background,
      fontSize: buttonInfo.fontSize ?? 24,
      fontWeight: buttonInfo.fontWeight ?? "700",
    } as TextStyle,
  });
}
