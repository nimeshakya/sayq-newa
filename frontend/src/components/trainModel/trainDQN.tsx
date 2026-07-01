// trainDQN.jsx
import { useState } from "react";

// Vite reads env variables prefixed with VITE_. Fallback to localhost if not defined.
import { ML_AGENT_API } from "@/constants";
import Toast from "../common/Toast";

export default function ModelTrainButton() {
  const [isTriggering, setIsTriggering] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleTrainModel = async () => {
    setIsTriggering(true);
    setStatusMessage("");
    setIsError(false);

    try {
      const response = await fetch(`${ML_AGENT_API}/api/train/rlmodel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Update UI with the accepted status
      setIsError(false);
      setStatusMessage("Training initiated successfully in the background!");

      // Clear the message after 5 seconds
      setTimeout(() => {
        setStatusMessage("");
      }, 5000);
    } catch (error) {
      console.error("Failed to trigger model training:", error);
      setIsError(true);
      setStatusMessage("Failed to start training. Check server connection.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <header>
      {/* Trigger Button */}
      <button
        onClick={handleTrainModel}
        disabled={isTriggering}
        style={{
          opacity: isTriggering ? 0.6 : 1,
          cursor: isTriggering ? "not-allowed" : "pointer",
        }}
      >
        {isTriggering ? "Triggering..." : "Retrain RL Model"}
      </button>

      {/* Notification Toast/Text */}
      {statusMessage && (
        <Toast
          type="success"
          message={statusMessage}
          onClose={() => setStatusMessage(null)}
        />
      )}
    </header>
  );
}
