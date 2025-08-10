import { useLocation, useNavigate } from "react-router";
import { useMemo, useState } from "react";
import "../styles/StoryTree.css";

export default function Play() {
    const location = useLocation();
    const navigate = useNavigate();
    const storyData = location.state?.storyData;

    const startSceneId = storyData?.startSceneId || "scene-1";
    const [sceneId, setSceneId] = useState(startSceneId);
    const currentScene = useMemo(() => storyData?.scenes?.[sceneId], [storyData, sceneId]);

    if (!storyData || !storyData.scenes || Object.keys(storyData.scenes).length === 0) {
        return (
            <div className="story-tree" style={{ textAlign: "center" }}>
                <h1>Play</h1>
                <p>No story loaded. Build your story first.</p>
                <button onClick={() => navigate("/story-tree")}>Go to Story Tree</button>
            </div>
        );
    }

    const isEnding =
        !currentScene || !currentScene.choices || currentScene.choices.every((c) => !c.nextSceneId);

    return (
        <div className="story-tree">
            <h1>Play</h1>

            <div className="intro-block">
                <h2>{sceneId}</h2>
                <p style={{ whiteSpace: "pre-wrap" }}>
                    {currentScene?.text || "The story ends here."}
                </p>
            </div>

            {!isEnding ? (
                <div className="choice-list">
                    <h3>What do you do?</h3>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        {currentScene.choices
                            .filter((c) => c.text?.trim())
                            .map((c, idx) => (
                                <button
                                    key={idx}
                                    className="add-choice-btn"
                                    onClick={() => {
                                        if (c.nextSceneId) setSceneId(c.nextSceneId);
                                    }}
                                    disabled={!c.nextSceneId}
                                    title={!c.nextSceneId ? "This path has no next scene yet" : ""}
                                >
                                    {c.text}
                                </button>
                            ))}
                    </div>
                </div>
            ) : (
                <div className="storytree-actions">
                    <button
                        className="save-scene-btn"
                        onClick={() => setSceneId(startSceneId)}
                        title="Restart from the beginning"
                    >
                        ↺ Restart
                    </button>
                    <button className="add-choice-btn" onClick={() => navigate("/story-tree")}>
                        ← Back to Editor
                    </button>
                </div>
            )}
        </div>
    );
}
