import { useLocation, useNavigate } from "react-router";
import { useState } from "react";
import "../styles/StoryTree.css";

export default function StoryTree() {
    const location = useLocation();
    const navigate = useNavigate();

    const { intro, formData } = location.state || {};
    const [sceneIntro, setSceneIntro] = useState(intro);
    const [hasSavedRootScene, setHasSavedRootScene] = useState(false);

    const [activeParent, setActiveParent] = useState(null); // { sceneId, choiceIdx }

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

    function handleExpandBranch(parentSceneId, choiceIdx) {
        setActiveParent({ sceneId: parentSceneId, choiceIdx });
        setSceneIntro("");
        setChoices([
            { id: 1, text: "", outcome: "" },
            { id: 2, text: "", outcome: "" },
        ]);
    }

    let activeParentBanner = null;
    if (activeParent && storyData.scenes[activeParent.sceneId]) {
        const parent = storyData.scenes[activeParent.sceneId];
        const parentChoice = parent.choices[activeParent.choiceIdx];
        activeParentBanner = (
            <div className="active-parent-banner">
                🌳 You are creating a new scene as the result of <b>{activeParent.sceneId}</b>,
                choice {activeParent.choiceIdx + 1}: "{parentChoice.text}"
            </div>
        );
    }

    const showEditor = !hasSavedRootScene || activeParent;

    return (
        <div className="story-tree">
            <h1>Story Tree Editor</h1>

            {showEditor ? (
                <>
                    {activeParentBanner}
                    <div className="intro-block">
                        <h2>Scene Narrative</h2>
                        {activeParent && (
                            <button
                                className="ai-suggest-narrative-btn"
                                style={{ marginBottom: "0.5rem" }}
                                onClick={async () => {
                                    // Get parent scene and choice info
                                    const parentScene = storyData.scenes[activeParent.sceneId];
                                    const choiceText =
                                        parentScene.choices[activeParent.choiceIdx].text;
                                    const choiceOutcome =
                                        parentScene.choices[activeParent.choiceIdx].outcome;

                                    // Call backend for AI narrative suggestion
                                    const response = await fetch(
                                        "http://localhost:5000/api/generate-narrative",
                                        {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                parentText: parentScene.text,
                                                choiceText,
                                                outcomeText: choiceOutcome,
                                            }),
                                        }
                                    );
                                    const data = await response.json();
                                    setSceneIntro(data.narrative); // Set the AI-generated narrative
                                }}
                            >
                                🪄 AI: Suggest Scene Narrative
                            </button>
                        )}
                        <textarea
                            value={sceneIntro}
                            onChange={(e) => setSceneIntro(e.target.value)}
                            rows={3}
                            style={{ width: "100%", fontSize: "1rem", marginTop: "0.5rem" }}
                            placeholder="Enter the narrative for this scene..."
                        />
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
                                    setChoices([
                                        ...choices,
                                        { id: Date.now(), text: "", outcome: "" },
                                    ])
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

                                    if (!sceneIntro || choiceTexts.length === 0) {
                                        alert(
                                            "Please enter the scene intro and at least one choice."
                                        );
                                        return;
                                    }

                                    // TODO: This calls the mock AI endpoint. Update the backend to use a real LLM later.
                                    const response = await fetch(
                                        "http://localhost:5000/api/generate-outcomes",
                                        {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                scene: sceneIntro,
                                                choices: choiceTexts,
                                            }),
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
                                    const sceneId =
                                        "scene-" + (Object.keys(storyData.scenes).length + 1);
                                    const newScene = {
                                        id: sceneId,
                                        text: sceneIntro,
                                        choices: choices.map((c) => ({
                                            text: c.text,
                                            outcome: c.outcome,
                                            nextSceneId: null,
                                        })),
                                    };

                                    if (activeParent) {
                                        setStoryData((prev) => {
                                            const parent = { ...prev.scenes[activeParent.sceneId] };
                                            parent.choices = parent.choices.map((c, i) =>
                                                i === activeParent.choiceIdx
                                                    ? { ...c, nextSceneId: sceneId }
                                                    : c
                                            );
                                            return {
                                                ...prev,
                                                scenes: {
                                                    ...prev.scenes,
                                                    [activeParent.sceneId]: parent,
                                                    [sceneId]: newScene,
                                                },
                                            };
                                        });
                                        setActiveParent(null);
                                    } else {
                                        setStoryData((prev) => ({
                                            ...prev,
                                            scenes: {
                                                ...prev.scenes,
                                                [sceneId]: newScene,
                                            },
                                        }));
                                        setHasSavedRootScene(true);
                                    }

                                    alert(
                                        "Scene saved! Story now has " +
                                            (Object.keys(storyData.scenes).length + 1) +
                                            " scenes."
                                    );

                                    setSceneIntro("");
                                    setChoices([
                                        { id: 1, text: "", outcome: "" },
                                        { id: 2, text: "", outcome: "" },
                                    ]);
                                }}
                            >
                                Save Scene
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ margin: "2rem 0", color: "#888" }}>
                    Click <b>+ New Scene</b> on a choice below to continue building your story!
                </div>
            )}

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
                                        {!choice.nextSceneId && (
                                            <button
                                                className="expand-branch-btn"
                                                onClick={() => handleExpandBranch(scene.id, idx)}
                                                style={{ marginLeft: "1rem" }}
                                            >
                                                + New Scene
                                            </button>
                                        )}
                                        {choice.nextSceneId && (
                                            <span style={{ color: "#60be7b", marginLeft: "1rem" }}>
                                                → {choice.nextSceneId}
                                            </span>
                                        )}
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
