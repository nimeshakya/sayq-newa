import { useState, useEffect, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/initialPages.style.scss";

export default function InitialPage() {
  const pages = ["greeting", "welcome", "level", "time", "start"];
  const path = "Assets/";

  type LevelProp = { id: number; level: string; value: string };
  type TimeProp = { id: number; time: number; value: string };
  type StartingProp = { id: number; option: string; value: string };
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
  const startOptions: StartingProp[] = [
    {
      id: 1,
      value: "Start from Scratch",
      option: "beginner",
    },
    {
      id: 2,
      value: "Find my Level",
      option: "quiz",
    },
  ];

  // controls the mount animation: login button appears after 2s
  const [loginVisible, setLoginVisible] = useState<boolean>(false);
  const [isLoggedin, setIsLoggedin] = useState<boolean>(false);
  const [hideQuestionTab, setHideQuestionTab] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentPage = pages[currentIndex];
  const [selectedTime, setSelectedTime] = useState<TimeProp | undefined>();
  const [selectedLevel, setSelectedLevel] = useState<LevelProp | undefined>();
  const [selectedStartOption, setSlectedStartOption] = useState<
    StartingProp | undefined
  >();
  const [isSelected, setIsSelected] = useState<boolean>(false);
  const navigate = useNavigate();

  const [imagePath, setImagePath] = useState<string>(path + "Namaste.gif");

  const AllocImage = () => {
    switch (currentPage) {
      case "greeting":
        setImagePath(path + "Hy.gif");
        break;
      case "welcome":
        setImagePath(path + "Write.gif");
        setHideQuestionTab(false);
        break;
      case "level":
        setImagePath(path + "Write.gif");
        break;
      case "time":
        setImagePath(path + "TakingNote.gif");
        setHideQuestionTab(true);
        break;
      case "start":
        setImagePath(path + "Namaste.gif");
        break;

      default:
        setImagePath(path + "Namaste.gif");
        break;
    }
  };

  // on mount, show login after 2 seconds and shift image left
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoginVisible(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = () => {
    setIsLoggedin(!isLoggedin);
    setLoginVisible(false);
    setCurrentIndex(currentIndex + 1);
    console.log(`User loggedin ${!isLoggedin}`);
  };

  const handleSelect = (item: LevelProp | TimeProp | StartingProp) => {
    if (currentPage === "time") {
      setSelectedTime(item as TimeProp);
      setIsSelected(true);
    } else if (currentPage === "level") {
      setSelectedLevel(item as LevelProp);
      setIsSelected(true);
    } else if (currentPage === "start") {
      setSlectedStartOption(item as StartingProp);
      setIsSelected(true);
    }
  };

  const handleContinue = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log(`Pressed on page: ${currentPage}`);
    if (!isLoggedin) {
      setCurrentIndex(0);
      console.log(`Cannot login
        user login status: ${isLoggedin}`);
      return;
    }

    if (currentIndex > 1 && !isSelected) {
      console.log(`select option first`);
      return;
    }

    if (currentIndex + 1 < pages.length) {
      setCurrentIndex(currentIndex + 1);
      setIsSelected(false);
    } else {
      console.log(`Pages completed`);
      console.log(`selected time: ${selectedTime?.time}`);
      console.log(`seleceted level: ${selectedLevel?.level}`);
      console.log(`seleceted start option: ${selectedStartOption?.value}`);
      setIsSelected(false);
      navigate("/dashboard");
    }
    AllocImage();
  };

  return (
    <div className="base">
      <div className="container">
        <div className="messageContainer">
          {/* <div>{currentPage}</div> */}
          {messages.find((item) => item.page === currentPage)?.message}
        </div>

        <div className="mascotContainer">
          <div className="optionGroup" hidden={hideQuestionTab}>
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

          <img
            src={imagePath}
            alt="Newa girl"
            className={`mascotStyle ${loginVisible ? "shift-left" : ""}`}
          />

          <div
            className={`loginOption ${loginVisible ? "visible" : "hidden"}`}
            onClick={handleLogin}
            role="button"
            tabIndex={loginVisible ? 0 : -1}
            aria-hidden={!loginVisible}
          >
            <img src="Assets/google_icon.png" alt="google logo" />
            Sign in with google
          </div>

          <div className="optionGroup " hidden={currentPage !== "start"}>
            {currentPage === "start" &&
              startOptions.map((option) => {
                const isSelected = selectedStartOption?.id === option.id;
                return (
                  <div
                    className={`optionStyle
                      ${isSelected ? "selected" : ""}`}
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    style={{
                      minHeight: "30%",
                      width: "60%",
                      alignContent: "end",
                    }}
                  >
                    <p style={{ textAlign: "center", color: "red" }}>
                      powerSignal
                    </p>
                    {option.value}
                  </div>
                );
              })}
          </div>
        </div>

        <button
          className="button"
          onClick={handleContinue}
          hidden={!isLoggedin}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
