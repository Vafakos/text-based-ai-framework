import { useLocation, useNavigate } from "react-router";
import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";

import { validateJSON } from "../lib/validateJSON.js";

import "../styles/StoryTree.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export default function StoryTree() {
    const location = useLocation();
    const navigate = useNavigate();
    const { intro, formData } = location.state || {};
    const [sceneIntro, setSceneIntro] = useState(intro);
    const [hasSavedRootScene, setHasSavedRootScene] = useState(false);
    const [activeParent, setActiveParent] = useState(null);
    const [currentSceneId, setCurrentSceneId] = useState(null);
    const [linkCtx, setLinkCtx] = useState(null);
    const [linkTargetId, setLinkTargetId] = useState("");

    const [storyData, setStoryData] = useState({
        scenes: {},
        startSceneId: "scene-1",
    });

    const [sceneType, setSceneType] = useState("narrative");
    const isPuzzleEditor = sceneType === "puzzle";

    const [puzzle, setPuzzle] = useState({
        prompt: "",
        solution: { mode: "regex", value: "", pattern: "", keywords: "" },
        maxAttempts: 3,
        hintsText: "",
        successNextSceneId: "",
        failNextSceneId: "",
    });

    const AUTOSAVE_KEY = "tbg_storyData_v1";
    const saveDebounceRef = useRef();
    const fileInputRef = useRef(null);

    const allSceneIds = useMemo(() => Object.keys(storyData?.scenes || {}), [storyData?.scenes]);

    function buildPuzzleFromState() {
        const hintsArr = (puzzle.hintsText || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

        const mode = puzzle.solution?.mode === "keywords" ? "keywords" : "regex";
        const sol = { mode };
        if (mode === "regex") {
            sol.pattern = puzzle.solution.pattern || "";
        } else {
            sol.keywords = (puzzle.solution.keywords || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        }

        return {
            prompt: puzzle.prompt || "",
            solution: sol,
            maxAttempts: Math.max(1, Number(puzzle.maxAttempts) || 3),
            hints: hintsArr,
            successNextSceneId: puzzle.successNextSceneId || "",
            failNextSceneId: puzzle.failNextSceneId || "",
        };
    }

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
        setSceneType("narrative");
        setPuzzle({
            prompt: "",
            solution: { mode: "regex", value: "", pattern: "", keywords: "" },
            maxAttempts: 3,
            hintsText: "",
            successNextSceneId: "",
            failNextSceneId: "",
        });
    }

    useEffect(() => {
        try {
            const raw = localStorage.getItem(AUTOSAVE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && parsed.scenes && Object.keys(parsed.scenes).length > 0) {
                    setStoryData(parsed);
                    setHasSavedRootScene(true);
                    toast.success("Autosave loaded.");
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
        setSceneType("narrative");
        setSceneType("narrative");
        setPuzzle({
            prompt: "",
            solution: { mode: "regex", pattern: "", keywords: "" },
            maxAttempts: 3,
            hintsText: "",
            successNextSceneId: "",
            failNextSceneId: "",
        });
    }

    function handleEditScene(sceneId) {
        const s = storyData.scenes[sceneId];
        if (!s) return;

        setActiveParent(null);
        setCurrentSceneId(sceneId);
        setSceneIntro(s.text || "");
        setChoices(
            (Array.isArray(s.choices) ? s.choices : []).map((c, i) => ({
                id: Date.now() + i,
                text: c.text || "",
                outcome: c.outcome || "",
                nextSceneId: c.nextSceneId ?? null,
            }))
        );

        const t = s.type || "narrative";
        setSceneType(t);

        if (t === "puzzle" && s.puzzle) {
            const p = s.puzzle;
            setPuzzle({
                prompt: p.prompt || "",
                solution: {
                    mode: p.solution?.mode === "keywords" ? "keywords" : "regex",
                    pattern: p.solution?.pattern || "",
                    keywords: Array.isArray(p.solution?.keywords)
                        ? p.solution.keywords.join(", ")
                        : "",
                },
                maxAttempts: p.maxAttempts ?? 3,
                hintsText: Array.isArray(p.hints) ? p.hints.join(", ") : "",
                successNextSceneId: p.successNextSceneId || "",
                failNextSceneId: p.failNextSceneId || "",
            });
        }
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

    function autoEnsurePuzzleTargets(prevState, puzzleObj) {
        const scenes = { ...prevState.scenes };
        const patched = { ...puzzleObj };

        if (!patched.successNextSceneId) {
            const id = nextSceneIdValue(scenes);
            scenes[id] = { id, text: "Puzzle solved.", choices: [] };
            patched.successNextSceneId = id;
        }
        if (!patched.failNextSceneId) {
            const id = nextSceneIdValue(scenes);
            scenes[id] = { id, text: "Puzzle failed.", choices: [] };
            patched.failNextSceneId = id;
        }

        return { scenes, puzzle: patched };
    }

    const showEditor = !hasSavedRootScene || !!activeParent || !!currentSceneId;

    async function handleSaveScene() {
        if (!sceneIntro.trim()) {
            toast.error("Scene narrative cannot be empty.");
            return;
        }
        const nonEmptyChoices = choices.filter((c) => c.text.trim());
        if (sceneType !== "puzzle" && nonEmptyChoices.length === 0) {
            toast.error("Please add at least one choice with text.");
            return;
        }
        if (sceneType === "puzzle") {
            const p = buildPuzzleFromState();
            if (!p.successNextSceneId || !p.failNextSceneId) {
                toast.error("Puzzle must have success and fail scene ids.");
                return;
            }
        }

        // EDIT existing scene
        if (currentSceneId && storyData.scenes[currentSceneId]) {
            setStoryData((prev) => {
                const updatedScene = {
                    ...prev.scenes[currentSceneId],
                    text: sceneIntro,
                    type: sceneType || "narrative",
                    choices: choices.map((c) => ({
                        text: c.text || "",
                        outcome: c.outcome || "",
                        nextSceneId: c.nextSceneId ?? null,
                    })),
                };
                if (sceneType === "puzzle") {
                    updatedScene.puzzle = buildPuzzleFromState();
                } else {
                    delete updatedScene.puzzle;
                }
                return {
                    ...prev,
                    scenes: {
                        ...prev.scenes,
                        [currentSceneId]: updatedScene,
                    },
                };
            });
            toast.success("Scene updated!");
            return;
        }

        // CREATE new scene (root or child)
        setStoryData((prev) => {
            const sceneId = nextSceneIdValue(prev.scenes);
            const newScene = {
                id: sceneId,
                text: sceneIntro,
                type: sceneType || "narrative",
                choices: choices.map((c) => ({
                    text: c.text || "",
                    outcome: c.outcome || "",
                    nextSceneId: null,
                })),
            };
            if (sceneType === "puzzle") {
                newScene.puzzle = buildPuzzleFromState();
            }

            if (activeParent) {
                const parent = { ...prev.scenes[activeParent.sceneId] };
                parent.choices = parent.choices.map((c, i) =>
                    i === activeParent.choiceIdx ? { ...c, nextSceneId: sceneId } : c
                );
                return {
                    ...prev,
                    scenes: {
                        ...prev.scenes,
                        [activeParent.sceneId]: parent,
                        [sceneId]: newScene,
                    },
                };
            }

            return {
                ...prev,
                scenes: {
                    ...prev.scenes,
                    [sceneId]: newScene,
                },
            };
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
        setSceneType("narrative");
        setPuzzle({
            prompt: "",
            solution: { mode: "regex", value: "", pattern: "", keywords: "" },
            maxAttempts: 3,
            hintsText: "",
            successNextSceneId: "",
            failNextSceneId: "",
        });
    }

    return (
        <div className="story-tree">
            <h1>Story Tree Editor</h1>

            {banner}

            {showEditor ? (
                <>
                    <div className="choice-list" style={{ marginBottom: "1rem" }}>
                        <h3>Scene Type</h3>
                        <div
                            style={{
                                display: "flex",
                                gap: "0.75rem",
                                flexWrap: "wrap",
                                alignItems: "center",
                            }}
                        >
                            <select
                                value={sceneType}
                                onChange={(e) => setSceneType(e.target.value)}
                                style={{ padding: ".5rem .7rem", borderRadius: 8 }}
                            >
                                <option value="narrative">Narrative</option>
                                <option value="dialogue">Dialogue</option>
                                <option value="puzzle">Puzzle</option>
                            </select>
                            {sceneType === "dialogue" && (
                                <span style={{ opacity: 0.8 }}>
                                    Tip: Use the narrative box for the NPC line; choices are the
                                    player replies.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="intro-block">
                        <h2>Scene Narrative</h2>
                        {isPuzzleEditor && activeParent && (
                            <button
                                className="ai-suggest-narrative-btn"
                                style={{ marginBottom: "0.5rem" }}
                                onClick={async () => {
                                    const parentScene = storyData.scenes[activeParent.sceneId];
                                    const choiceText =
                                        parentScene.choices[activeParent.choiceIdx].text;
                                    const choiceOutcome =
                                        parentScene.choices[activeParent.choiceIdx].outcome;

                                    await toast.promise(
                                        fetch(`${API_BASE}/generate-narrative`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                parentText: parentScene.text,
                                                choiceText,
                                                outcomeText: choiceOutcome,
                                            }),
                                        })
                                            .then((res) => {
                                                if (!res.ok) throw new Error("Server error");
                                                return res.json();
                                            })
                                            .then((data) => {
                                                if (!data || !data.narrative) {
                                                    throw new Error("No narrative returned");
                                                }
                                                setSceneIntro(data.narrative);
                                            }),
                                        {
                                            loading: "Generating narrative…",
                                            success: "Narrative generated!",
                                            error: "Failed to generate narrative.",
                                        }
                                    );
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
                    {sceneType === "puzzle" && (
                        <div className="choice-list" style={{ marginTop: "0.75rem" }}>
                            <h3>Puzzle</h3>

                            <label style={{ display: "block", margin: "0.5rem 0 0.25rem" }}>
                                Prompt shown to player
                            </label>
                            <input
                                type="text"
                                className="puzzle-input"
                                value={puzzle.prompt}
                                onChange={(e) => setPuzzle({ ...puzzle, prompt: e.target.value })}
                                placeholder="e.g., Enter password:"
                            />

                            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
                                <div
                                    style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                                >
                                    <label>Solution mode:</label>
                                    <select
                                        value={puzzle.solution.mode}
                                        onChange={(e) =>
                                            setPuzzle({
                                                ...puzzle,
                                                solution: {
                                                    ...puzzle.solution,
                                                    mode: e.target.value,
                                                },
                                            })
                                        }
                                    >
                                        <option value="regex">Input</option>
                                        <option value="keywords">Keywords (comma-separated)</option>
                                    </select>
                                </div>

                                {puzzle.solution.mode === "regex" && (
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <input
                                            type="text"
                                            className="puzzle-input"
                                            placeholder="Pattern, e.g. ^(riddle|RIDDLE)$"
                                            value={puzzle.solution.pattern}
                                            onChange={(e) =>
                                                setPuzzle({
                                                    ...puzzle,
                                                    solution: {
                                                        ...puzzle.solution,
                                                        pattern: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                )}

                                {puzzle.solution.mode === "keywords" && (
                                    <input
                                        type="text"
                                        className="puzzle-input"
                                        placeholder="Keywords (comma-separated)"
                                        value={puzzle.solution.keywords}
                                        onChange={(e) =>
                                            setPuzzle({
                                                ...puzzle,
                                                solution: {
                                                    ...puzzle.solution,
                                                    keywords: e.target.value,
                                                },
                                            })
                                        }
                                    />
                                )}
                            </div>

                            <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.75rem" }}>
                                <input
                                    type="text"
                                    className="puzzle-input"
                                    placeholder="Hints (comma-separated)"
                                    value={puzzle.hintsText}
                                    onChange={(e) =>
                                        setPuzzle({ ...puzzle, hintsText: e.target.value })
                                    }
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "0.75rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <label>Max attempts:</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="puzzle-input"
                                        style={{ maxWidth: 120 }}
                                        value={puzzle.maxAttempts}
                                        onChange={(e) =>
                                            setPuzzle({
                                                ...puzzle,
                                                maxAttempts: Number(e.target.value || 1),
                                            })
                                        }
                                    />
                                </div>

                                <div style={{ display: "grid", gap: "0.5rem" }}>
                                    <input
                                        type="text"
                                        className="puzzle-input"
                                        placeholder='successNextSceneId (e.g., "scene-x")'
                                        value={puzzle.successNextSceneId}
                                        onChange={(e) =>
                                            setPuzzle({
                                                ...puzzle,
                                                successNextSceneId: e.target.value,
                                            })
                                        }
                                    />
                                    <input
                                        type="text"
                                        className="puzzle-input"
                                        placeholder='failNextSceneId (e.g., "scene-x")'
                                        value={puzzle.failNextSceneId}
                                        onChange={(e) =>
                                            setPuzzle({
                                                ...puzzle,
                                                failNextSceneId: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {isPuzzleEditor && (
                        <div
                            className="choice-list"
                            style={{ marginTop: "0.75rem", opacity: 0.85 }}
                        >
                            <h3>Choices</h3>
                            <p style={{ margin: 0 }}>
                                Choices are disabled for puzzle scenes. The puzzle input replaces
                                choices in Play mode.
                            </p>
                        </div>
                    )}

                    {!isPuzzleEditor && (
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

                                        await toast.promise(
                                            fetch(`${API_BASE}/generate-outcomes`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    scene: sceneIntro,
                                                    choices: choiceTexts,
                                                }),
                                            })
                                                .then((res) => {
                                                    if (!res.ok) throw new Error("Server error");
                                                    return res.json();
                                                })
                                                .then((data) => {
                                                    if (!data || !Array.isArray(data.outcomes)) {
                                                        throw new Error("No outcomes returned");
                                                    }
                                                    setChoices((prev) =>
                                                        prev.map((choice, idx) => ({
                                                            ...choice,
                                                            outcome:
                                                                data.outcomes[idx] ??
                                                                choice.outcome,
                                                        }))
                                                    );
                                                }),
                                            {
                                                loading: "Generating outcomes…",
                                                success: "Outcomes generated!",
                                                error: "Failed to generate outcomes.",
                                            }
                                        );
                                    }}
                                >
                                    🪄 AI Assist: Generate Outcomes
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="storytree-actions" style={{ marginTop: "1rem" }}>
                        <button className="save-scene-btn" onClick={handleSaveScene}>
                            💾 Save Scene
                        </button>
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
                                        {!choice.nextSceneId &&
                                        !(
                                            linkCtx &&
                                            linkCtx.sceneId === scene.id &&
                                            linkCtx.choiceIdx === idx
                                        ) ? (
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
                                        <button
                                            className="edit-btn"
                                            type="button"
                                            onClick={() => {
                                                if (!allSceneIds.length) {
                                                    toast("No saved scenes yet to link.");
                                                    return;
                                                }
                                                setLinkCtx({ sceneId: scene.id, choiceIdx: idx });
                                                setLinkTargetId(
                                                    choice.nextSceneId || allSceneIds[0]
                                                );
                                            }}
                                            title="Link this choice to an existing scene"
                                        >
                                            🔗 Link Existing
                                        </button>
                                        {linkCtx &&
                                            linkCtx.sceneId === scene.id &&
                                            linkCtx.choiceIdx === idx && (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: ".5rem",
                                                        alignItems: "center",
                                                        marginTop: ".5rem",
                                                    }}
                                                >
                                                    <select
                                                        value={linkTargetId}
                                                        onChange={(e) =>
                                                            setLinkTargetId(e.target.value)
                                                        }
                                                        style={{
                                                            padding: ".45rem .6rem",
                                                            borderRadius: 8,
                                                        }}
                                                    >
                                                        {allSceneIds
                                                            .filter((sid) => sid !== currentSceneId)
                                                            .map((sid) => (
                                                                <option key={sid} value={sid}>
                                                                    {sid}
                                                                </option>
                                                            ))}
                                                    </select>

                                                    <button
                                                        className="save-scene-btn"
                                                        type="button"
                                                        onClick={() => {
                                                            if (!linkTargetId) return;
                                                            setStoryData((prev) => {
                                                                const s = prev.scenes[scene.id];
                                                                if (!s) return prev;
                                                                const updated = {
                                                                    ...prev,
                                                                    scenes: {
                                                                        ...prev.scenes,
                                                                        [scene.id]: {
                                                                            ...s,
                                                                            choices: s.choices.map(
                                                                                (c, i) =>
                                                                                    i === idx
                                                                                        ? {
                                                                                              ...c,
                                                                                              nextSceneId:
                                                                                                  linkTargetId,
                                                                                          }
                                                                                        : c
                                                                            ),
                                                                        },
                                                                    },
                                                                };
                                                                return updated;
                                                            });
                                                            if (currentSceneId === scene.id) {
                                                                setChoices((prev) =>
                                                                    prev.map((c, i) =>
                                                                        i === idx
                                                                            ? {
                                                                                  ...c,
                                                                                  nextSceneId:
                                                                                      linkTargetId,
                                                                              }
                                                                            : c
                                                                    )
                                                                );
                                                            }
                                                            toast.success(
                                                                `Linked to ${linkTargetId}`
                                                            );
                                                            setLinkCtx(null);
                                                            setLinkTargetId("");
                                                        }}
                                                    >
                                                        Link
                                                    </button>

                                                    <button
                                                        className="remove-btn"
                                                        type="button"
                                                        onClick={() => {
                                                            setLinkCtx(null);
                                                            setLinkTargetId("");
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                    </li>
                                ))}
                            </ul>
                            <b>{scene.type}</b>
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
