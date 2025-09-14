import pigeon from "@/assets/video/Pigeon.gif";
import { Base } from "@/components/custom/base";
import { NavButton } from "@/components/custom/button";
import { MessageBubble } from "@/components/custom/message";
import React, { useState } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function Start() {
  const [message, setMessage] = useState("Welcome, My Dear Friend!");
  const [pressed, setPressed] = useState(false);

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
    fontWeight: 600,
  };

  return (
    <Base>
      {({ styles: baseStyles }) => {
        const styles = createStyle(); // ✅ styles as function
        return (
          <>
            <View style={styles.topContainer}>
              <MessageBubble messageInfo={messageInfo} message={message} />
              <View style={styles.gifContainer}>
                <Image source={pigeon} style={styles.gif} />
              </View>
            </View>
            <NavButton
              buttonInfo={buttoninfo}
              onPress={() => {
                setMessage(
                  "Just few quick questions before we start your first lesson!"
                );
                setPressed(true);
              }}
              link={pressed ? "/level" : undefined}
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
