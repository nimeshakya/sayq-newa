import { QuizFlashCard } from "@/components/questions/flashCard";
import { View, Text, StyleSheet } from "react-native";
import { Base } from "@/components/custom/base";
import { useMCQContext } from "@/context/MCQContext";
import { useEffect } from "react";

export default function FlashCardPage() {
  const { setTest, clearTest } = useMCQContext();

  const test = [
    {
      id: "1",
      question: " Question 1",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "2",
      question: " Question 2",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "3",
      question: " Question 3",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "4",
      question: " Question 4",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "5",
      question: " Question 5",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "6",
      question: " Question 6",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "7",
      question: " Question 7",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "8",
      question: " Question 8",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
    {
      id: "9",
      question: " Question 9",
      options: ["correctAnswer", "option1", "option2", "option3"],
      correctAnswer: "correctAnswer",
    },
  ];

  useEffect(() => {
    clearTest();
    setTest(test);
  }, []);

  return (
    <Base>
      {({ theme, colorScheme, styles: baseStyle }) => {
        const styles = createStyle(theme);
        return (
          <View style={styles.baseContainer}>
            <QuizFlashCard />
          </View>
        );
      }}
    </Base>
  );
}

function createStyle(theme: { background: string; text: string }) {
  return StyleSheet.create({
    baseContainer: {
      padding: 35,
      flex: 1,
    },
  });
}
