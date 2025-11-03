import { Colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import { NavButton } from "../custom/button";
import {
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import { FlatList } from "react-native";
import { useMCQContext } from "@/context/MCQContext";

export function QuizFlashCard() {
  const colorScheme = useColorScheme() ?? "light";
  const theme = colorScheme === "dark" ? Colors.dark : Colors.light;
  const styles = createStyle(theme);

  const { test, scores, results, setScores, setResults } = useMCQContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = test[currentIndex];
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPressed, setPressed] = useState<boolean>(false);
  const [isCorrect, setCorrect] = useState<boolean>(false);
  const [attempt, setAttempt] = useState<number>(0);
  const [showResult, setShowResult] = useState<boolean>(false);

  if (!test || test.length === 0) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={styles.textStyle}>Loading questions...</Text>
      </View>
    );
  }

  if (!currentQuestion) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={styles.textStyle}>
          No question available or index out of range.
        </Text>
      </View>
    );
  }

  const handleCardSelect = ([item, index]: [string, number]) => {
    console.log(`Correct answer?: ${item === currentQuestion.correctAnswer}`);
    setCorrect(item === currentQuestion.correctAnswer);
    setSelectedAnswer(item);
    setPressed(!isPressed);
    setAttempt(attempt + 1);
  };

  if (showResult) {
    return (
      <ScrollView>
        <Text style={styles.textStyle}>Sakyo</Text>

        {results.map((result, index) => (
          <View key={result.id ?? index} style={{ marginVertical: 8 }}>
            <Text style={styles.textStyle}>ID: {result.id}</Text>
            <Text style={styles.textStyle}>Selected: {result.selected}</Text>
            <Text style={styles.textStyle}>Attempts: {result.attempts}</Text>
            <Text style={styles.textStyle}>
              ResponseTime: {result.responseTime}
            </Text>
            <Text style={styles.textStyle}>
              Correct: {String(result.isCorrect)}
            </Text>
          </View>
        ))}

        <Text style={[styles.textStyle, { backgroundColor: "red" }]}>
          Your Score: {scores} out of {results.length}
          {"\n"}
        </Text>
        <NavButton link="/dashboard" buttonInfo={{}} text="Continue" />
      </ScrollView>
    );
  }

  const handleNext = () => {
    if (!selectedAnswer) return;

    setResults((prev) => [
      ...prev,
      {
        id: currentQuestion.id,
        selected: selectedAnswer,
        attempts: attempt,
        responseTime: new Date().toISOString(),
        isCorrect: isCorrect,
      },
    ]);

    isCorrect
      ? setScores(scores + (Number(currentQuestion.marks) || 1))
      : setScores(scores);
    setAttempt(0);

    console.log(`Next button pressed:
      selected:${selectedAnswer}
      attempt:${attempt}
      score:${scores}
      correct:${currentQuestion.correctAnswer}`);

    if (currentIndex + 1 < test.length) {
      // Move to next question

      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setPressed(false);
      setCorrect(false);
    } else {
      // End of quiz
      setShowResult(true);
      setPressed(false);
      setCorrect(false);
    }
  };

  const CardColor = (item: string) => {
    if (isCorrect && selectedAnswer === item) {
      return [styles.card, styles.correctCard];
    } else if (!isCorrect && selectedAnswer === item) {
      return [styles.card, styles.wrongCard];
    } else {
      return styles.card;
    }
  };

  return (
    <View style={styles.baseContainer}>
      <Text style={styles.textStyle}>
        Q{currentIndex + 1}. {currentQuestion.question}
      </Text>

      <FlatList
        data={currentQuestion.options}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => handleCardSelect([item, index])}
            style={CardColor(item)}
          >
            {!isPressed || selectedAnswer !== item ? (
              <Text style={[styles.textStyle, styles.cardTextStyle]}>
                Tap To Reveal {index}
              </Text>
            ) : (
              <Text style={[styles.textStyle, styles.cardTextStyle]}>
                {item}
              </Text>
            )}
          </Pressable>
        )}
        contentContainerStyle={styles.cardContainer}
      />

      <NavButton
        text="Next"
        onPress={handleNext}
        buttonInfo={{
          color: theme.text,
          borderColor: theme.text,
          borderWidth: 2,
        }}
      />
    </View>
  );
}

function createStyle(theme: {
  text: string;
  colorText: string;
  background: string;
}) {
  return StyleSheet.create({
    baseContainer: {
      borderWidth: 2,
      borderColor: theme.text,
      borderRadius: 14,
      padding: 20,
      flex: 1,
    },
    cardContainer: {
      marginVertical: 30,
      flexDirection: "column",
      justifyContent: "space-evenly",
    },
    card: {
      borderWidth: 2,
      borderColor: theme.text,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "lightblue",
      height: 200,
      width: 120,
      margin: 10,
      padding: 8,
    },
    correctCard: {
      backgroundColor: "lightgreen",
    },
    wrongCard: {
      backgroundColor: "red",
    },

    textStyle: {
      color: theme.text,
      fontWeight: 700,
      fontSize: 18,
      width: "100%",
    },
    cardTextStyle: {
      textAlign: "center",
    },
  });
}
