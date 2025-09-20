import pigeon from "@/assets/video/Pigeon.gif";
import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { MessageBubble } from "@/components/custom/message";
import { OptionBox } from "@/components/custom/optionBox";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { useEffect } from "react";

import { useOption } from "@/context/optionContext";
import { useMessage } from "@/context/messageContext";

export default function Time() {
  const router = useRouter();

  const { clearOption, option, time, setTime } = useOption();
  const { setMessage } = useMessage();

  useEffect(() => {
    setMessage("What's your daily learning goal?");
  }, []);

  const handleContinue = async () => {
    if (!option.key || !option.value) {
      console.log("Please select an option!");
      return;
    } else {
      console.log(`selected time: ${option.key}:${option.value}`);
      setTime(option);
      clearOption();
      router.replace("/courseBuildPage");
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
    keywordFontSize: 16,
    keywordFontWeight: 600,
  };

  const messageInfo = {
    fontSize: 20,
    fontWeight: "500",
    messageBoxWidth: "70%",
    pointerStatus: false,
  };

  const options = [
    {
      key: "1",
      value: "3 min/Day",
      keyword: "Casual",
    },
    {
      key: "2",
      value: "10 min/Day",
      keyword: "Regular",
    },
    {
      key: "3",
      value: "15 min/Day",
      keyword: "Serious",
    },
    {
      key: "4",
      value: "20 min/Day",
      keyword: "Intense",
    },
  ];
  const optionInfo = {
    selectedBoxColor: "#feae42",
    fontSize: 20,
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
