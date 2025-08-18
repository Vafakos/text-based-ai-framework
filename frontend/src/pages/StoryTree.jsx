import { useLocation, useNavigate } from "react-router";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";

import { validateJSON } from "../lib/validateJSON.js";

import "../styles/StoryTree.css";

export default function StoryTree() {
    const location = useLocation();
    const navigate = useNavigate();

    const { intro, formData } = location.state || {};
    const [sceneIntro, setSceneIntro] = useState(intro);
    const [hasSavedRootScene, setHasSavedRootScene] = useState(false);

    const [activeParent, setActiveParent] = useState(null);

    const [currentSceneId, setCurrentSceneId] = useState(null);

    const [storyData, setStoryData] = useState({
        scenes: {},
        startSceneId: "scene-1",
    });

    const AUTOSAVE_KEY = "tbg_storyData_v1";
    const saveDebounceRef = useRef();
    const fileInputRef = useRef(null);

    function exportStoryToFile(data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${data.title || "story"}-story.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleImportFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result);
                const { ok, errors } = validateJSON(parsed);
                if (!ok) {
                    toast.error("Invalid story JSON:\n" + errors.join("\n"));
                    return;
                }
                setStoryData(parsed);
                setHasSavedRootScene(Object.keys(parsed.scenes).length > 0);
                setActiveParent(null);
                setCurrentSceneId(null);
                setSceneIntro("");
                setChoices([
                    { id: 1, text: "", outcome: "", nextSceneId: null },
                    { id: 2, text: "", outcome: "", nextSceneId: null },
                ]);
                toast.success("Story imported.");
            } catch (e) {
                toast.error("Invalid JSON file.");
                console.error(e);
            }
        };

        reader.readAsText(file);
    }

    function resetEditorToBlank() {
        setActiveParent(null);
        setCurrentSceneId(null);
        setHasSavedRootScene(false);
        setSceneIntro(intro || "");
        setChoices([
            { id: 1, text: "", outcome: "", nextSceneId: null },
            { id: 2, text: "", outcome: "", nextSceneId: null },
        ]);
        setStoryData({ scenes: {}, startSceneId: "scene-1" });
    }

    useEffect(() => {
        try {
            const raw = localStorage.getItem(AUTOSAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.scenes && Object.keys(parsed.scenes).length > 0) {
                    setStoryData(parsed);
                    setHasSavedRootScene(true);
                    toast("Autosave loaded.");
                }
            }
        } catch (e) {
            console.error("Failed to load autosave:", e);
        }
    }, []);

    useEffect(() => {
        window.clearTimeout(saveDebounceRef.current);
        saveDebounceRef.current = window.setTimeout(() => {
            try {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(storyData));
            } catch (e) {
                console.error("Failed to save autosave:", e);
            }
        }, 300);

        return () => window.clearTimeout(saveDebounceRef.current);
    }, [storyData]);

    const [choices, setChoices] = useState([
        { id: 1, text: "", outcome: "", nextSceneId: null },
        { id: 2, text: "", outcome: "", nextSceneId: null },
    ]);

    function nextSceneIdValue(prevScenes) {
        return "scene-" + (Object.keys(prevScenes).length + 1);
    }

    function handleExpandBranch(parentSceneId, choiceIdx) {
        setActiveParent({ sceneId: parentSceneId, choiceIdx });
        setCurrentSceneId(null);
        setSceneIntro("");
        setChoices([
            { id: 1, text: "", outcome: "", nextSceneId: null },
            { id: 2, text: "", outcome: "", nextSceneId: null },
        ]);
    }

    function handleEditScene(sceneId) {
        const s = storyData.scenes[sceneId];
        if (!s) return;
        setActiveParent(null);
        setCurrentSceneId(sceneId);
        setSceneIntro(s.text);
        setChoices(
            s.choices.map((c, i) => ({
                id: Date.now() + i,
                text: c.text,
                outcome: c.outcome,
                nextSceneId: c.nextSceneId ?? null,
            }))
        );
    }

    // banner text for context
    let banner = null;
    if (activeParent && storyData.scenes[activeParent.sceneId]) {
        const parent = storyData.scenes[activeParent.sceneId];
        const parentChoice = parent.choices[activeParent.choiceIdx];
        banner = (
            <div className="active-parent-banner">
                🌳 You are creating a new scene as the result of <b>{activeParent.sceneId}</b>,
                choice {activeParent.choiceIdx + 1}: "{parentChoice.text}"
            </div>
        );
    } else if (currentSceneId) {
        banner = (
            <div className="current-scene-banner">
                ✏️ <strong>Currently Editing:</strong> {currentSceneId}
            </div>
        );
    } else if (!hasSavedRootScene) {
        banner = (
            <div className="current-scene-banner">
                🌱 <strong>Currently Editing:</strong> Root Scene
            </div>
        );
    }

    const showEditor = !hasSavedRootScene || !!activeParent || !!currentSceneId;

    async function handleSaveScene() {
        if (!sceneIntro.trim()) {
            toast.error("Scene narrative cannot be empty.");
            return;
        }
        const nonEmptyChoices = choices.filter((c) => c.text.trim());
        if (nonEmptyChoices.length === 0) {
            toast.error("Please add at least one choice with text.");
            return;
        }

        // EDIT existing scene
        if (currentSceneId && storyData.scenes[currentSceneId]) {
            setStoryData((prev) => ({
                ...prev,
                scenes: {
                    ...prev.scenes,
                    [currentSceneId]: {
                        ...prev.scenes[currentSceneId],
                        text: sceneIntro,
                        choices: choices.map((c) => ({
                            text: c.text,
                            outcome: c.outcome,
                            nextSceneId: c.nextSceneId ?? null,
                        })),
                    },
                },
            }));
            toast.success("Scene updated!");
            return;
        }

        // CREATE new scene (root or child)
        setStoryData((prev) => {
            const sceneId = nextSceneIdValue(prev.scenes);
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
                const parent = { ...prev.scenes[activeParent.sceneId] };
                parent.choices = parent.choices.map((c, i) =>
                    i === activeParent.choiceIdx ? { ...c, nextSceneId: sceneId } : c
                );
                const updated = {
                    ...prev,
                    scenes: {
                        ...prev.scenes,
                        [activeParent.sceneId]: parent,
                        [sceneId]: newScene,
                    },
                };
                return updated;
            }

            // root scene
            const updated = {
                ...prev,
                scenes: {
                    ...prev.scenes,
                    [sceneId]: newScene,
                },
            };
            return updated;
        });

        if (activeParent) {
            setActiveParent(null);
            toast.success("Child scene created and linked!");
        } else {
            setHasSavedRootScene(true);
            setCurrentSceneId(null);
            toast.success("Root scene saved!");
        }

        setSceneIntro("");
        setChoices([
            { id: 1, text: "", outcome: "", nextSceneId: null },
            { id: 2, text: "", outcome: "", nextSceneId: null },
        ]);
    }

    return (
        <div className="story-tree">
            <h1>Story Tree Editor</h1>

            {banner}

            {showEditor ? (
                <>
                    <div className="intro-block">
                        <h2>Scene Narrative</h2>
                        {activeParent && (
                            <button
                                className="ai-suggest-narrative-btn"
                                style={{ marginBottom: "0.5rem" }}
                                onClick={async () => {
                                    const parentScene = storyData.scenes[activeParent.sceneId];
                                    const choiceText =
                                        parentScene.choices[activeParent.choiceIdx].text;
                                    const choiceOutcome =
                                        parentScene.choices[activeParent.choiceIdx].outcome;

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
                                    setSceneIntro(data.narrative);
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
                                        className="remove-btn"
                                        onClick={() => {
                                            setChoices(choices.filter((c, i) => i !== idx));
                                        }}
                                        disabled={choices.length <= 1 || !!choice.nextSceneId}
                                        title={
                                            choice.nextSceneId
                                                ? "Cannot remove: this choice links to " +
                                                  choice.nextSceneId
                                                : ""
                                        }
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
                                        {
                                            id: Date.now(),
                                            text: "",
                                            outcome: "",
                                            nextSceneId: null,
                                        },
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
                                        toast.error(
                                            "Please enter the scene narrative and at least one choice."
                                        );
                                        return;
                                    }

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
                                onClick={handleSaveScene}
                            >
                                💾 Save Scene
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div style={{ margin: "2rem 0", color: "#888" }}>
                    Click <b>+ New Scene</b> on a choice below, or ✏️ <b>Edit</b> an existing scene.
                </div>
            )}
            <div
                className="storytree-actions"
                style={{ justifyContent: "flex-start", marginTop: 0 }}
            >
                <button
                    className="add-choice-btn"
                    onClick={() => exportStoryToFile(storyData)}
                    title="Download your story as JSON"
                >
                    ⬇️ Export JSON
                </button>

                <button
                    className="add-choice-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Load a story JSON file"
                >
                    ⬆️ Import JSON
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleImportFile(file);
                        e.target.value = "";
                    }}
                />

                <button
                    className="save-scene-btn"
                    onClick={() => {
                        localStorage.removeItem(AUTOSAVE_KEY);
                        resetEditorToBlank();
                        toast.success("Autosave cleared.");
                    }}
                >
                    🧹 Clear Autosave
                </button>
            </div>

            <div className="story-summary">
                <h3>Saved Scenes</h3>
                <ul>
                    {Object.values(storyData.scenes).map((scene) => (
                        <li key={scene.id}>
                            <b>{scene.id}:</b> {scene.text.slice(0, 60)}...
                            <button className="edit-btn" onClick={() => handleEditScene(scene.id)}>
                                ✏️ Edit
                            </button>
                            <ul>
                                {scene.choices.map((choice, idx) => (
                                    <li key={idx}>
                                        <i>{choice.text}</i> → {choice.outcome.slice(0, 40)}...
                                        {!choice.nextSceneId ? (
                                            <button
                                                className="expand-branch-btn"
                                                onClick={() => handleExpandBranch(scene.id, idx)}
                                                style={{ marginLeft: "1rem" }}
                                            >
                                                + New Scene
                                            </button>
                                        ) : (
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
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button
                    className="play-btn"
                    onClick={() => navigate("/play", { state: { storyData } })}
                    title="Play from the start scene"
                >
                    ▶ Play From Start
                </button>
            </div>
        </div>
    );
}
