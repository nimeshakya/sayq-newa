import { useState } from "react";
import SessionComponent from "../components/session.component";
import "../styles/_shared.scss";

export default function SessionPage() {
  const [count, setCount] = useState<number>(10);
  const [category, setCategory] = useState<string>("");
  const [expertise, setExpertise] = useState<number>(0);

  return (
    <div className="pageContainer">
      <div className="modelType">Configure Session</div>
      <div className="formGroup" style={{ marginBottom: 16 }}>
        <label>Count</label>
        <input
          type="number"
          min={1}
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value || "0", 10))}
        />
      </div>
      <div className="formGroup" style={{ marginBottom: 16 }}>
        <label>Category</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. basic"
        />
      </div>
      <div className="formGroup" style={{ marginBottom: 16 }}>
        <label>Expertise Level</label>
        <input
          type="number"
          min={0}
          max={5}
          value={expertise}
          onChange={(e) => setExpertise(parseInt(e.target.value || "0", 10))}
        />
      </div>

      <SessionComponent
        count={count}
        category={category || undefined}
        expertise_lvl={Number.isFinite(expertise) ? expertise : undefined}
        headingDisplay="Review + New"
      />
    </div>
  );
}
