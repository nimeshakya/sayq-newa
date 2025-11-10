import { useState, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/initialPages.style.scss";

export default function InitialPage() {
  const pages = ["welcome", "level", "time"];

  type LevelProp = { id: number; level: string; value: string };
  type TimeProp = { id: number; time: number; value: string };
  type MessageProp = { page: string; message: string };

  const messages: MessageProp[] = [
    {
      page: "welcome",
      message: "Hey there, I am Yomari!",
    },
    {
      page: "level",
      message: "How much Nepal: Bhasa do you know?",
    },
    {
      page: "time",
      message: "What's your daily learning goal?",
    },
  ];
  const timeOption: TimeProp[] = [
    {
      id: 1,
      time: 3,
      value: "3 min/day",
    },
    {
      id: 2,
      time: 10,
      value: "10 min/day",
    },
    {
      id: 3,
      time: 20,
      value: "20 min/day",
    },
    {
      id: 4,
      time: 30,
      value: "30 min/day",
    },
  ];
  const levelOption: LevelProp[] = [
    {
      id: 1,
      level: "A1",
      value: "I am new to Nepal Bhasa",
    },
    {
      id: 2,
      level: "B1",
      value: "I know some common words",
    },
    {
      id: 3,
      level: "C1",
      value: "I can have some basic conversation",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentPage = pages[currentIndex];
  const [selectedTime, setSelectedTime] = useState<TimeProp | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<LevelProp | undefined>();
  const navigate = useNavigate();

  const [imagePath, setImagePath] = useState<string>(
    "../public/Assets/GreetingNamasteIllustration.gif"
  );

  const handleSelect = (item: LevelProp | TimeProp) => {
    if (currentPage === "time") {
      setSelectedTime(item as TimeProp);
    } else if (currentPage === "level") {
      setSelectedLevel(item as LevelProp);
    }
  };

  const handleContinue = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setImagePath("../public/Assets/WritingNotesIllustratorFinal.gif");
    console.log(`Pressed on page: ${currentPage}`);
    if (currentIndex + 1 < pages.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log(`Pages completed`);
      console.log(`selected time: ${selectedTime?.time}`);
      console.log(`seleceted level: ${selectedLevel?.level}`);
      navigate("/dashboard");
    }
  };

  return (
    <div className="base">
      <div className="messageContainer">
        {/* <div>{currentPage}</div> */}
        {messages.find((item) => item.page === currentPage)?.message}
      </div>

      <div className="mascotContainer">
        <div className="optionGroup">
          {currentPage === "time" &&
            timeOption.map((option) => {
              const isSelected = selectedTime?.id === option.id;
              return (
                <div
                  className={`optionStyle ${isSelected ? "selected" : ""}`}
                  key={option.id}
                  onClick={() => handleSelect(option)}
                >
                  {option.value}
                </div>
              );
            })}
          {currentPage === "level" &&
            levelOption.map((option) => {
              const isSelected = selectedLevel?.id === option.id;
              return (
                <div
                  className={`optionStyle ${isSelected ? "selected" : ""}`}
                  key={option.id}
                  onClick={() => handleSelect(option)}
                >
                  {option.value}
                </div>
              );
            })}
        </div>
        <img src={imagePath} alt="Newa girl" className="mascontStyle" />
      </div>

      <button className="button" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
}
