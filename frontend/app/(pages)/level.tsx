import pigeon from "@/assets/video/Pigeon.gif";
import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { MessageBubble } from "@/components/custom/message";
import { OptionBox } from "@/components/custom/optionBox";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

import { useOption } from "@/context/optionContext";
import { useMessage } from "@/context/messageContext";

export default function Level() {
  const router = useRouter();

  const { clearOption, option, level, setLevel } = useOption();
  const { setMessage } = useMessage();
  useEffect(() => {
    setMessage("How familiar are you with Nepal Bhasa?");
  }, []);

  const handleContinue = async () => {
    if (!option) {
      console.log("Please select an option!");
      return;
    } else {
      console.log(`selected level: ${option.key}:${option.value}`);
      setLevel(option);
      clearOption();
      router.replace("/learnTime");
    }
  };

  const buttoninfo = {
    backgroundColor: "#FFAE42",
    marginHorizontal: "auto",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    width: 273,
    height: 46,
    color: "black",
    fontSize: 16,
    fontWeight: 700,
  };

  const messageInfo = {
    color: "#FFAE42",
    fontSize: 20,
    fontWeight: "500",
    messageBoxWidth: "70%",
    pointerStatus: false,
  };

  const options = [
    {
      key: "1",
      icon: "hellow",
      value: "I am new to Nepal Bhasa",
    },
    {
      key: "2",
      icon: "hellow",
      value: "I know some common words",
    },
    {
      key: "3",
      icon: "hellow",
      value: "I can have some basic conversation",
    },
    {
      key: "4",
      icon: "hellow",
      value: "I can talk about various topics",
    },
    {
      key: "5",
      icon: "hellow",
      value: "I can discuss most topics in detail",
    },
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
              <MessageBubble messageInfo={messageInfo} theme={theme} />
            </View>
            <OptionBox
              options={options}
              optionInfo={optionInfo}
              theme={theme}
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
      height: 149,
      marginLeft: 50,
      resizeMode: "contain",
    },
  });
}
