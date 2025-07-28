import { useLocation, useNavigate } from "react-router";
import { useState } from "react";
import "../styles/StoryTree.css";

export default function StoryTree() {
    const location = useLocation();
    const navigate = useNavigate();

    const { intro, formData } = location.state || {};

    const [storyData, setStoryData] = useState({
        scenes: {},
        startSceneId: "scene-1",
    });

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
                <div className="storytree-actions">
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
                            const choiceTexts = choices
                                .filter((c) => c.text.trim())
                                .map((c) => c.text);

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
                    <button
                        className="save-scene-btn"
                        style={{ marginTop: "1.5rem" }}
                        onClick={() => {
                            const sceneId = "scene-" + (Object.keys(storyData.scenes).length + 1);
                            setStoryData((prev) => ({
                                ...prev,
                                scenes: {
                                    ...prev.scenes,
                                    [sceneId]: {
                                        id: sceneId,
                                        text: intro,
                                        choices: choices.map((c) => ({
                                            text: c.text,
                                            outcome: c.outcome,
                                            nextSceneId: null, // TODO: wire this in the future
                                        })),
                                    },
                                },
                            }));
                            alert(
                                "Scene saved! Story now has " +
                                    (Object.keys(storyData.scenes).length + 1) +
                                    " scenes."
                            );
                            // Optionally: Reset choices, clear outcome fields, or go to the next scene
                        }}
                    >
                        Save Scene
                    </button>
                </div>
            </div>
            <div className="story-summary">
                <h3>Saved Scenes</h3>
                <ul>
                    {Object.values(storyData.scenes).map((scene) => (
                        <li key={scene.id}>
                            <b>{scene.id}:</b> {scene.text.slice(0, 60)}...
                            <ul>
                                {scene.choices.map((choice, idx) => (
                                    <li key={idx}>
                                        <i>{choice.text}</i> → {choice.outcome.slice(0, 40)}...
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
