import pigeon from "@/assets/video/Pigeon.gif";
import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { MessageBubble } from "@/components/custom/message";
import { OptionBox } from "@/components/custom/optionBox";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Level() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<Options | null>(null);

  const handleContinue = async () => {
    if (!selectedOption) {
      console.log("Please select an option!");
      return;
    } else {
      console.log(`selected key: ${selectedOption.key}`);
      router.replace("/");
    }
  };
  const fullText = "How familiar are you with Nepal Bhasa?";

  const buttoninfo = {
    backgroundColor: "#FFAE42",
    marginHorizontal: "auto",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 35,
    borderRadius: 10,
    width: 341,
    height: 62,
    color: "black",
    fontSize: 24,
    fontWeight: 900,
  };

  const messageInfo = {
    color: "#FFAE42",
    fontSize: 20,
    fontWeight: 500,
    messageBoxWidth: "70%",
    pointerStatus: false,
  };

  const options = [
    { key: "1", value: "I am new to Nepal Bhasa" },
    { key: "2", value: "I know some common words" },
    { key: "3", value: "I can have some basic conversation" },
    { key: "4", value: "I can talk about various topics" },
    { key: "5", value: "I can discuss most topics in detail" },
  ];
  const optionInfo = {
    selectedBoxColor: "#feae42",
    fontSize: 16,
    fontWeight: 600,
  };

  return (
    <Base>
      {({ theme, colorScheme, styles: baseStyles }) => {
        const styles = createStyle(); // ✅ styles as function
        return (
          <>
            <View style={styles.topContainer}>
              <View style={styles.gifContainer}>
                <Image source={pigeon} style={styles.gif} />
              </View>
              <MessageBubble
                messageInfo={messageInfo}
                message={fullText}
                theme={theme}
              />
            </View>
            <OptionBox
              options={options}
              optionInfo={optionInfo}
              theme={theme}
              onSelect={(item) => setSelectedOption(item)}
            />
            <NavButton
              buttonInfo={buttoninfo}
              onPress={handleContinue}
              text="Continue"
              theme={theme}
            />
          </>
        );
      }}
    </Base>
  );
}

function createStyle() {
  return StyleSheet.create({
    topContainer: {
      flexDirection: "row",
      justifyContent: "center",
      width: "100%",
      marginTop: 65,
    },
    gifContainer: {
      marginRight: 0,
    },
    gif: {
      width: 112,
      height: 159,
      resizeMode: "contain",
    },
  });
}
