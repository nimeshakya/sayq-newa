import { Base } from "@/components/custom/base";
import { StyleSheet, Text, View } from "react-native";
import { useMCQContext } from "@/context/MCQContext";
import { QuizMCQ } from "@/components/questions/MCQ";
import { useEffect } from "react";

export default function QuestionPage() {
  const options = [
    {
      id: "1",
      question:
        " Lorem ipsum dolor sit, amet consectetur adipisicing elit. Saepe in quis velit exercitationem sed hic error quibusdam explicabo, atque sint natus sunt rem voluptas iste provident, labore vitae veritatis aut.",
      options: ["a", "b", "c"],
      correctAnswer: "a",
    },
    {
      id: "2",
      question:
        " Lorem ipsum dolor sit, amet consectetur adipisicing elit. Saepe in quis velit exercitationem sed hic error quibusdam explicabo, atque sint natus sunt rem voluptas iste provident, labore vitae veritatis aut.",
      options: ["a", "b", "c"],
      correctAnswer: "a",
    },
    {
      id: "3",
      question:
        " Lorem ipsum dolor sit, amet consectetur adipisicing elit. Saepe in quis velit exercitationem sed hic error quibusdam explicabo, atque sint natus sunt rem voluptas iste provident, labore vitae veritatis aut.",
      options: ["a", "b", "c"],
      correctAnswer: "a",
    },
  ];

  const { setTest, clearTest } = useMCQContext();

  useEffect(() => {
    clearTest();
    setTest(options);
  }, []);

  return (
    <Base>
      {({ theme, colorScheme, styles: baseStyle }) => {
        const styles = createStyle(theme);
        return (
          <>
            <View style={styles.baseContainer}>
              <QuizMCQ />
            </View>
          </>
        );
      }}
    </Base>
  );
}

function createStyle(theme: { text: string; background: string }) {
  return StyleSheet.create({
    baseContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    textStyle: {
      color: theme.text,
    },
  });
}
