import { useNavigate } from "react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import { validateJSON } from "../lib/validateJSON";
import "../styles/StoryTree.css";

export default function PublicPlay() {
    const navigate = useNavigate();
    const [fileName, setFileName] = useState("");

    async function onFile(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);

        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const { ok, errors } = validateJSON(parsed);
            if (!ok) {
                toast.error("Invalid story JSON:\n" + errors.join("\n"));
                return;
            }
            localStorage.setItem("tbg_storyData_v1", JSON.stringify(parsed));
            toast.success("Story loaded. Enjoy!");
            navigate("/play", { state: { storyData: parsed, public: true } });
        } catch (err) {
            console.error(err);
            toast.error("Failed to read JSON file.");
        }
    }

    return (
        <div className="story-tree" style={{ maxWidth: 720 }}>
            <h1>Play a Story</h1>
            <div className="choice-list">
                <h3>Import a Story JSON</h3>
                <p style={{ opacity: 0.85, marginTop: 6 }}>
                    Select a <code>.json</code> file exported from the editor.
                </p>
                <label
                    htmlFor="publicPlayFile"
                    className="add-choice-btn"
                    style={{ display: "inline-block", marginTop: 12 }}
                >
                    📥 Choose File
                </label>
                <input
                    id="publicPlayFile"
                    type="file"
                    accept="application/json"
                    style={{ display: "none" }}
                    onChange={onFile}
                />
                {fileName && <p style={{ marginTop: 8, opacity: 0.8 }}>Selected: {fileName}</p>}
            </div>
        </div>
    );
}
