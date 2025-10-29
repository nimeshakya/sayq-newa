import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { StyleSheet, View, Text } from "react-native";
export default function Dashboard() {
  return (
    <Base>
      {({ theme, colorScheme, styles: baseStyles }) => {
        const styles = createStyle(theme);
        return (
          <>
            <View style={styles.rootContainer}>
              <Text style={styles.textStyle}>Dashboard goes here</Text>
            </View>
            <NavButton
              link="/questionPage"
              text="Continue"
              buttonInfo={{ width: "300" }}
            />
          </>
        );
      }}
    </Base>
  );
}

function createStyle(theme: { text: string }) {
  return StyleSheet.create({
    rootContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "red",
    },
    textStyle: {
      color: theme.text,
      fontSize: 40,
      textAlign: "center",
      fontWeight: 700,
    },
  });
}
