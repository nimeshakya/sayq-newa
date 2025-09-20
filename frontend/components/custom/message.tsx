import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ViewStyle, TextStyle } from "react-native";

import { useMessage } from "@/context/messageContext";

type MessageInfo = {
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  messageBoxWidth?: string;
  pointerStatus?: boolean;
  messageBoxOutline?: string;
  messageBoxFill?: string;
};

type MessageProps = {
  messageInfo: MessageInfo;
  theme: { background: string; text: string };
};

export function MessageBubble({ theme, messageInfo }: MessageProps) {
  const styles = createStyle(messageInfo, theme);
  const [displayedText, setDisplayedText] = useState("");
  const pointerStatus = messageInfo.pointerStatus ?? true;

  const { message } = useMessage();
  useEffect(() => {
    let index = 0;
    let interval: number | undefined;
    const timeout = setTimeout(() => {
      interval = window.setInterval(() => {
        setDisplayedText(message.slice(0, index + 1));
        index++;
        if (index === message.length) {
          clearInterval(interval);
        }
      }, 150); // typing speed
    }, 500); // ⏳ wait 1000ms before starting

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [message]);
  return (
    <View style={styles.messageWrapper}>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{displayedText}</Text>
      </View>
      {pointerStatus && <View style={styles.triangle} />}
    </View>
  );
}

function createStyle(
  messageInfo: MessageInfo,
  theme: { background: string; text: string }
) {
  return StyleSheet.create({
    messageWrapper: {
      position: "relative", // parent for absolute positioning
      width: messageInfo.messageBoxWidth ?? "100%", // full width container
      alignItems: "flex-end", // bubble on left
    } as ViewStyle,
    messageBubble: {
      minWidth: 100,
      borderWidth: 1,
      backgroundColor: messageInfo.messageBoxFill ?? theme.background,
      borderColor: messageInfo.messageBoxOutline ?? theme.text,
      borderRadius: 10,
      marginRight: 60,
      paddingVertical: 10,
      paddingHorizontal: 20,
      maxWidth: "70%", // prevents bubble from stretching too wide
    } as ViewStyle,
    triangle: {
      position: "absolute",
      bottom: -11, // below bubble
      right: 90, // fixed horizontal position
      width: 0,
      height: 0,
      borderLeftWidth: 10,
      borderRightWidth: 10,
      borderTopWidth: 12,
      borderLeftColor: "transparent",
      borderRightColor: "transparent",
      borderTopColor: messageInfo.messageBoxOutline ?? theme.text,
    } as ViewStyle,
    messageText: {
      color: messageInfo.color ?? theme.text,
      fontSize: messageInfo.fontSize ?? 20,
      fontWeight: messageInfo.fontWeight ?? "600",
    } as TextStyle,
  });
}
