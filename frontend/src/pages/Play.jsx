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

    const startSceneId = storyData.startSceneId || "scene-1";
    const [history, setHistory] = useState([{ sceneId: startSceneId }]);
    const [visited, setVisited] = useState(() => new Set([startSceneId]));

    const totalScenes = useMemo(() => Object.keys(storyData.scenes).length, [storyData.scenes]);

    const currentSceneId = history[history.length - 1]?.sceneId;
    const currentScene = useMemo(
        () => storyData.scenes?.[currentSceneId],
        [storyData, currentSceneId]
    );

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

            {!isEnding ? (
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
            <h2 className="tbg-ending-title">The End</h2>
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
