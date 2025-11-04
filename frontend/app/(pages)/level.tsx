import LadyWriting from "@/assets/video/appuse/WritingNotesIllustratorFinal.gif";
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
    if (!option.key || !option.value) {
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
      icon: "hello",
      value: "I am new to Nepal Bhasa",
    },
    {
      key: "2",
      icon: "hello",
      value: "I know some common words",
    },
    {
      key: "3",
      icon: "hello",
      value: "I can have some basic conversation",
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
          <View style={styles.baseContainer}>
            <View style={styles.topContainer}>
              <View style={styles.messageContainer}>
                <MessageBubble messageInfo={messageInfo} theme={theme} />
                <View style={styles.gifContainer}>
                  <Image source={LadyWriting} style={styles.gif} />
                </View>
              </View>
              <OptionBox options={options} optionInfo={optionInfo} />
            </View>
            <NavButton
              buttonInfo={buttoninfo}
              onPress={handleContinue}
              text="Continue"
            />
          </View>
        );
      }}
    </Base>
  );
}

function createStyle() {
  return StyleSheet.create({
    baseContainer: {
      flex: 1,
    },
    topContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 30,
    },
    messageContainer: {
      flexDirection: "row",

      alignItems: "center",
    },
    gifContainer: {
      marginRight: 0,
    },
    gif: {
      width: 112,
      height: 149,
      resizeMode: "contain",
    },
  });
}
