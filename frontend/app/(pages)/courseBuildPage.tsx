import pigeon from "@/assets/video/Pigeon.gif";
import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { MessageBubble } from "@/components/custom/message";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

import { useMessage } from "@/context/messageContext";
import { useOption } from "@/context/optionContext";

export default function Build() {
  const { setMessage } = useMessage();
  const { level } = useOption();
  const router = useRouter();
  useEffect(() => {
    level.key === "1"
      ? setMessage("Ok, we will start fresh!")
      : setMessage("Ok, we will build on what you know!");
  }, []);

  const handleContinue = async () => {
    router.replace("/dashboard");
  };
  const buttoninfo = {
    backgroundColor: "#FFAE42",
    marginHorizontal: "auto",
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "600",
  };

  return (
    <Base>
      {({ theme, colorScheme, styles: baseStyles }) => {
        const styles = createStyle(); // ✅ styles as function
        return (
          <>
            <View style={styles.topContainer}>
              <MessageBubble messageInfo={messageInfo} theme={theme} />
              <View>
                <Image source={pigeon} style={styles.gif} />
              </View>
            </View>
            <NavButton
              buttonInfo={buttoninfo}
              onPress={handleContinue}
              text="Continue"
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
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
    },
    gif: {
      width: 250,
      height: 333,
      resizeMode: "contain",
    },
  });
}
