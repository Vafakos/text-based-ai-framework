import { useLocation, useNavigate } from "react-router";
import { useState } from "react";
import "../styles/StoryTree.css";

export default function StoryTree() {
    const location = useLocation();
    const navigate = useNavigate();

    const { intro, formData } = location.state || {};

    const [choices, setChoices] = useState([
        { id: 1, text: "", outcome: "" },
        { id: 2, text: "", outcome: "" },
    ]);

    if (!intro || !formData) {
        return (
            <div>
                <p>Invalid access. Please start by creating a game.</p>
                <button onClick={() => navigate("/form")}>Go to Form</button>
            </div>
        );
    }

    return (
        <div className="story-tree">
            <h1>Story Tree Editor</h1>
            <div className="intro-block">
                <h2>Game Intro</h2>
                <p>{intro}</p>
            </div>
            <div className="choice-list">
                <h3>Add Choices for This Scene</h3>
                {choices.map((choice, idx) => (
                    <div
                        className="choice-item"
                        key={choice.id}
                        style={{ flexDirection: "column", alignItems: "stretch" }}
                    >
                        <div style={{ display: "flex", alignItems: "center" }}>
                            <input
                                type="text"
                                value={choice.text}
                                placeholder={`Choice #${idx + 1}`}
                                onChange={(e) => {
                                    const updated = [...choices];
                                    updated[idx].text = e.target.value;
                                    setChoices(updated);
                                }}
                                style={{ flex: 1, marginRight: 8 }}
                            />
                            <button
                                onClick={() => {
                                    setChoices(choices.filter((c, i) => i !== idx));
                                }}
                                disabled={choices.length <= 2}
                            >
                                Remove
                            </button>
                        </div>
                        <textarea
                            value={choice.outcome}
                            placeholder="Describe what happens for this choice..."
                            onChange={(e) => {
                                const updated = [...choices];
                                updated[idx].outcome = e.target.value;
                                setChoices(updated);
                            }}
                            rows={2}
                            style={{ marginTop: 8, width: "100%" }}
                        />
                    </div>
                ))}
                <button
                    className="add-choice-btn"
                    onClick={() =>
                        setChoices([...choices, { id: Date.now(), text: "", outcome: "" }])
                    }
                >
                    + Add Choice
                </button>
                <button
                    className="ai-assist-btn"
                    onClick={async () => {
                        const choiceTexts = choices.filter((c) => c.text.trim()).map((c) => c.text);

                        if (!intro || choiceTexts.length === 0) {
                            alert("Please enter the scene intro and at least one choice.");
                            return;
                        }

                        // TODO: This calls the mock AI endpoint. Update the backend to use a real LLM later.
                        const response = await fetch(
                            "http://localhost:5000/api/generate-outcomes",
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ scene: intro, choices: choiceTexts }),
                            }
                        );

                        const data = await response.json();

                        // TODO: Update the outcome fields with AI responses
                        setChoices(
                            choices.map((choice, idx) => ({
                                ...choice,
                                outcome: data.outcomes[idx] || choice.outcome,
                            }))
                        );
                    }}
                >
                    🪄 AI Assist: Generate Outcomes
                </button>
            </div>
        </div>
    );
}
