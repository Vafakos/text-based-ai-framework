import { useLocation, useNavigate } from "react-router";
import { useMemo, useState, useCallback, useEffect } from "react";
import "../styles/StoryTree.css";

export default function Play() {
    const location = useLocation();
    const navigate = useNavigate();

    const storyData =
        location.state?.storyData ||
        (() => {
            try {
                const raw = localStorage.getItem("tbg_storyData_v1");
                return raw ? JSON.parse(raw) : null;
            } catch {
                return null;
            }
        })();

    if (!storyData || !storyData.scenes || Object.keys(storyData.scenes).length === 0) {
        return (
            <div className="story-tree" style={{ textAlign: "center" }}>
                <h1>Play</h1>
                <p>No story loaded. Build your story first.</p>
                <button onClick={() => navigate("/story-tree")}>Go to Story Tree</button>
            </div>
        );
    }

    function isPuzzleScene(scene) {
        return scene?.type === "puzzle" && scene?.puzzle && typeof scene.puzzle === "object";
    }

    function puzzleCheck(scene, answer) {
        if (!scene?.puzzle || !scene?.puzzle?.solution) return false;
        const { solution } = scene.puzzle;
        const a = String(answer || "").trim();

        if (solution.mode === "regex") {
            try {
                const re = new RegExp(solution.pattern || "");
                return re.test(a);
            } catch {
                return false;
            }
        }

        if (solution.mode === "keywords") {
            const need = Array.isArray(solution.keywords) ? solution.keywords : [];
            const low = a.toLowerCase();
            return need.every((k) => low.includes(String(k).toLowerCase()));
        }

        return false;
    }

    function handlePuzzleSubmit() {
        const scene = currentScene;
        const ok = puzzleCheck(scene, puzzleInput);
        const { successNextSceneId, failNextSceneId, maxAttempts = 3 } = scene.puzzle || {};

        if (ok) {
            if (successNextSceneId) {
                setHistory((h) => [...h, { sceneId: successNextSceneId }]);
            }
            setPuzzleInput("");
            setPuzzleAttempts(0);
            return;
        }

        const nextAttempts = puzzleAttempts + 1;
        setPuzzleAttempts(nextAttempts);

        if (nextAttempts >= maxAttempts) {
            if (failNextSceneId) {
                setHistory((h) => [...h, { sceneId: failNextSceneId }]);
            }
            setPuzzleInput("");
            setPuzzleAttempts(0);
        }
    }

    const startSceneId = storyData.startSceneId || "scene-1";
    const [history, setHistory] = useState([{ sceneId: startSceneId }]);
    const [visited, setVisited] = useState(() => new Set([startSceneId]));

    const totalScenes = useMemo(() => Object.keys(storyData.scenes).length, [storyData.scenes]);

    const currentSceneId = history[history.length - 1]?.sceneId;
    const currentScene = useMemo(
        () => storyData.scenes?.[currentSceneId],
        [storyData, currentSceneId]
    );

    const [puzzleInput, setPuzzleInput] = useState("");
    const [puzzleAttempts, setPuzzleAttempts] = useState(0);

    useEffect(() => {
        if (currentSceneId && !visited.has(currentSceneId)) {
            setVisited((prev) => {
                const next = new Set(prev);
                next.add(currentSceneId);
                return next;
            });
        }
    }, [currentSceneId]);

    const canGoBack = history.length > 1;

    const goBack = useCallback(() => {
        setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
    }, []);

    const restart = useCallback(() => {
        setHistory([{ sceneId: startSceneId }]);
        setVisited(new Set([startSceneId]));
    }, [startSceneId]);

    const choose = useCallback(
        (choice) => {
            if (!choice) return;
            if (choice.nextSceneId) {
                setHistory((h) => [...h, { sceneId: choice.nextSceneId, choiceId: choice.id }]);
            } else {
                setHistory((h) => [...h, { sceneId: currentSceneId, choiceId: choice.id }]);
            }
        },
        [currentSceneId]
    );

    const jumpTo = useCallback(
        (index) => {
            if (index < 0 || index >= history.length) return;
            const delta = history.length - 1 - index;
            for (let i = 0; i < delta; i++) goBack();
        },
        [history.length, goBack]
    );

    const progress = useMemo(() => {
        if (!totalScenes) return 0;
        return Math.min(1, visited.size / totalScenes);
    }, [visited.size, totalScenes]);

    const isEnding = useMemo(() => {
        if (!currentScene) return true;
        if (isPuzzleScene(currentScene)) return false;
        const hasValidNext = currentScene.choices?.some(
            (c) => c.nextSceneId && storyData.scenes?.[c.nextSceneId]
        );
        return !hasValidNext;
    }, [currentScene, storyData.scenes]);

    const breadcrumbIds = useMemo(() => history.map((h) => h.sceneId), [history]);

    return (
        <div className="story-tree">
            <h1>Play</h1>

            <ProgressBar value={progress} />

            <BreadcrumbTrail ids={breadcrumbIds} onJump={jumpTo} />

            <div className="intro-block">
                <h2>{currentSceneId}</h2>
                <p style={{ whiteSpace: "pre-wrap" }}>
                    {currentScene?.text || "The story continues..."}
                </p>
            </div>

            {isPuzzleScene(currentScene) && (
                <div className="choice-list" style={{ marginTop: "-0.25rem" }}>
                    <h3>{currentScene?.puzzle?.prompt || "Your answer:"}</h3>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <input
                            type="text"
                            value={puzzleInput}
                            onChange={(e) => setPuzzleInput(e.target.value)}
                            placeholder="Type answer…"
                            className="puzzle-input"
                        />
                        <button className="save-scene-btn" onClick={handlePuzzleSubmit}>
                            Submit
                        </button>
                    </div>
                    {currentScene?.puzzle?.hints &&
                        puzzleAttempts > 0 &&
                        currentScene.puzzle.hints[puzzleAttempts - 1] && (
                            <p style={{ marginTop: "0.5rem", opacity: 0.85 }}>
                                Hint: {currentScene.puzzle.hints[puzzleAttempts - 1]}
                            </p>
                        )}
                </div>
            )}

            {!isEnding && !isPuzzleScene(currentScene) ? (
                <>
                    <div className="choice-list">
                        <h3>What do you do?</h3>
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            {(currentScene?.choices || [])
                                .filter((c) => c.text?.trim())
                                .map((c, idx) => {
                                    const isEndingChoice = !c.nextSceneId;
                                    const targetExists = c.nextSceneId
                                        ? !!storyData.scenes?.[c.nextSceneId]
                                        : true;
                                    const leadsToVisited =
                                        !!c.nextSceneId && visited.has(c.nextSceneId);
                                    return (
                                        <button
                                            key={idx}
                                            className={`add-choice-btn ${
                                                leadsToVisited ? "visited-choice" : ""
                                            }`}
                                            onClick={() =>
                                                targetExists && choose({ ...c, id: String(idx) })
                                            }
                                            disabled={!targetExists}
                                            title={
                                                !targetExists
                                                    ? `Target scene "${c.nextSceneId}" doesn't exist`
                                                    : isEndingChoice
                                                    ? "This choice ends the story"
                                                    : leadsToVisited
                                                    ? "You've been here before"
                                                    : ""
                                            }
                                        >
                                            {c.text}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    <div className="storytree-actions" style={{ justifyContent: "space-between" }}>
                        <button
                            className="save-scene-btn"
                            onClick={goBack}
                            disabled={!canGoBack}
                            title={canGoBack ? "Go back one step" : "Can't go back"}
                        >
                            ← Back
                        </button>
                        <button className="add-choice-btn" onClick={() => navigate("/story-tree")}>
                            ✏️ Back to Editor
                        </button>
                    </div>
                </>
            ) : (
                <EndingScreen
                    stats={{
                        steps: Math.max(0, history.length - 1),
                        visitedCount: visited.size,
                        totalScenes,
                    }}
                    onRestart={restart}
                    onEdit={() => navigate("/story-tree")}
                />
            )}
        </div>
    );
}

function ProgressBar({ value }) {
    const pct = Math.round((value || 0) * 100);
    return (
        <div className="tbg-progress">
            <div className="tbg-progress-top">
                <span>Progress</span>
                <span>{pct}%</span>
            </div>
            <div className="tbg-progress-rail">
                <div className="tbg-progress-fill" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function BreadcrumbTrail({ ids, onJump }) {
    const compact = ids.filter((id, i) => i === 0 || ids[i - 1] !== id);
    return (
        <div className="tbg-breadcrumb">
            {compact.map((id, idx) => (
                <button
                    key={`${id}-${idx}`}
                    className="tbg-crumb"
                    onClick={() => onJump(idx)}
                    title={`Jump to ${id}`}
                >
                    {id}
                    {idx < compact.length - 1 ? " ›" : ""}
                </button>
            ))}
        </div>
    );
}

function EndingScreen({ stats, onRestart, onEdit }) {
    return (
        <div className="tbg-ending">
            <p className="tbg-ending-sub">
                You visited {stats.visitedCount} of {stats.totalScenes} scenes in {stats.steps}{" "}
                steps.
            </p>
            <div className="tbg-ending-actions">
                <button className="save-scene-btn" onClick={onRestart}>
                    ↺ Play Again
                </button>
                <button className="add-choice-btn" onClick={onEdit}>
                    ✏️ Back to Editor
                </button>
            </div>
        </div>
    );
}
