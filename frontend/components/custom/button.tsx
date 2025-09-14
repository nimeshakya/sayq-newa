import { Link } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

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
  marginBottom: number | string;

  borderWidth?: number;
  borderColor?: string;
  borderStyle?: string;
  borderRadius?: number;

  color?: string;
  fontSize?: number;
  fontWeight?: number;
};

type NavButtonProps = {
  buttonInfo: ButtonInfo;
  text: string;
  link?: string;
  onPress?: () => void;
  theme?: { background: string; text: string };
};

export function NavButton({
  theme,
  buttonInfo,
  link,
  text,
  onPress,
}: NavButtonProps) {
  const styles = createStyle(buttonInfo, theme);
  if (link) {
    // navigation version
    return (
      <Link href={link} asChild>
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
  buttonInfo: ButtonInfo["buttonInfo"],
  theme: { background: string; text: string }
) {
  return StyleSheet.create({
    button: {
      backgroundColor: buttonInfo.backgroundColor ?? theme.text,

      justifyContent: "center",
      alignItems: "center",

      alignSelf: "flex-start",
      width: buttonInfo.width ?? "auto",
      height: buttonInfo.height ?? "auto",

      padding: buttonInfo.padding ?? 0,
      paddingHorizontal: buttonInfo.paddingHorizontal ?? 0,
      paddingVertical: buttonInfo.paddingVertical ?? 0,

      margin: buttonInfo.margin ?? 0,
      marginHorizontal: buttonInfo.marginHorizontal ?? 0,
      marginVertical: buttonInfo.marginVertical ?? 0,
      marginTop: buttonInfo.marginTop ?? 0,
      marginBottom: buttonInfo.marginBottom ?? 0,

      borderRadius: buttonInfo.borderRadius ?? 10,
      borderWidth: buttonInfo.borderWidth ?? 1,
      borderStyle: buttonInfo.borderStyle ?? "solid",
      borderColor: buttonInfo.borderColor ?? theme.background,
    },
    buttonText: {
      color: buttonInfo.color ?? theme.background,
      fontSize: buttonInfo.fontSize ?? 24,
      fontWeight: buttonInfo.fontWeight ?? 900,
    },
  });
}
