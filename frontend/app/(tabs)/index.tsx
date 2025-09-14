import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { StyleSheet } from "react-native";
import { View } from "react-native";
export default function HomeScreen() {
  const buttoninfo = {
    backgroundColor: "#FFAE42",
    marginTop: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    width: 341,
    height: 62,
    color: "black",
    fontSize: 24,
    fontWeight: 900,
  };
  return (
    <Base>
      {({ theme, colorScheme, styles: baseStyles }) => {
        const styles = createStyle(); // ✅ styles as function
        return (
          <View style={styles.container}>
            <NavButton
              buttonInfo={buttoninfo}
              link="/start"
              text="Start"
              theme={theme}
            />
          </View>
        );
      }}
    </Base>
  );
}
function createStyle() {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
  });
}
