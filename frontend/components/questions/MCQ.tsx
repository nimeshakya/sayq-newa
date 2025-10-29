import { Colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import { NavButton } from "../custom/button";
import {
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Pressable,
} from "react-native";

import { useMCQContext } from "@/context/MCQContext";

type Options = {
  id: string;
  question: string;
  answers: string[];
  correct: string;
};

type MCQProps = {
  options: Options[];
};

export function MCQ() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyle(theme);

  const { test, results, scores, setResults, setScores } = useMCQContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  if (!test || test.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: theme.colorText }}>Loading questions...</Text>
      </View>
    );
  }

  const currentQuestion = test[currentIndex];

  if (!currentQuestion) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: theme.colorText }}>
          No question available or index out of range.
        </Text>
      </View>
    );
  }

  const handleOptionSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return; // Prevent skipping

    const isCorrect = selectedAnswer === currentQuestion.correct;
    const currentMarks = Number(currentQuestion.marks ?? 1);
    const updateScore = isCorrect ? scores + currentMarks : scores;

    setResults((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        selected: selectedAnswer,
        attempts: 1,
        responseTime: new Date().toISOString(),
        isCorrect: isCorrect,
      },
    ]);

    setScores(updateScore);

    console.log(
      `selected:${selectedAnswer} correct: ${currentQuestion.correct} is correct: ${isCorrect}`
    );

    if (currentIndex + 1 < test.length) {
      // Move to next question
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    } else {
      // End of quiz
      setShowResult(true);
    }
  };

  if (showResult) {
    const correctCount = results.filter((r) => r.isCorrect).length;
    console.log(`Test: ${test}`);
    console.log(`Result: ${results}`);
    console.log(`Scores: ${scores}`);
    return (
      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>
          Quiz Completed 🎉{"\n"}
          You got {correctCount} out of {test.length} correct!
        </Text>
        <NavButton link="/dashboard" buttonInfo={{}} text="Continue" />
      </View>
    );
  }

  return (
    <View style={styles.baseContainer}>
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>
          Q{currentIndex + 1}. {currentQuestion.question}
        </Text>
      </View>

      <View style={styles.optionGroup}>
        {currentQuestion.answers.map((item) => {
          const isSelected = selectedAnswer === item;
          return (
            <Pressable
              key={item}
              onPress={() => handleOptionSelect(item)}
              style={[styles.optionBox, isSelected && styles.selectedBox]}
            >
              <Text
                style={[styles.optionText, isSelected && styles.selectedText]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <NavButton text="Submit" buttonInfo={{}} onPress={handleSubmit} />
    </View>
  );
}

function createStyle(theme: { colorText: string; text: string }) {
  return StyleSheet.create({
    baseContainer: {
      borderWidth: 1,
      borderRadius: 16,
      borderColor: theme.colorText,
      padding: 16,
      margin: 16,
    },
    questionContainer: {
      padding: 18,
      borderColor: theme.colorText,
    },
    optionGroup: {
      marginVertical: 20,
    },
    optionBox: {
      borderWidth: 2,
      borderColor: theme.colorText,
      borderRadius: 8,
      marginVertical: 6,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    selectedBox: {
      backgroundColor: theme.colorText,
    },
    questionText: {
      color: theme.colorText,
      fontWeight: "700",
      fontSize: 18,
    },
    optionText: {
      color: theme.text,
      fontWeight: "700",
      fontSize: 16,
      textAlign: "center",
    },
    selectedText: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    resultContainer: {
      padding: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    resultText: {
      color: theme.colorText,
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
    },
  });
}
