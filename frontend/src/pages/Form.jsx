import { useState } from "react";
import { useNavigate } from "react-router";

import "../styles/Form.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export default function Form() {
    const navigate = useNavigate();
    const [gameTitle, setGameTitle] = useState("");
    const [genre, setGenre] = useState("Fantasy");
    const [setting, setSetting] = useState("");
    const [tone, setTone] = useState("Serious");
    const [mainCharacter, setMainCharacter] = useState("");
    const [goal, setGoal] = useState("");
    const [generatedIntro, setGeneratedIntro] = useState("");
    const [loadingIntro, setLoadingIntro] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = {
            gameTitle,
            genre,
            setting,
            tone,
            mainCharacter,
            goal,
        };
        console.log("Form submitted:", formData);

        try {
            setLoadingIntro(true);
            const response = await fetch(`${API_BASE}/generate-game`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            navigate("/story-tree", { state: { intro: result.intro, formData } });
        } catch (err) {
            console.error("Error sending data to backend:", err);
        } finally {
            setLoadingIntro(false);
        }
    };

    const handleReset = () => {
        setGameTitle("");
        setGenre("Fantasy");
        setSetting("");
        setTone("Serious");
        setMainCharacter("");
        setGoal("");
        setGeneratedIntro("");
    };

    return (
        <div className="game-form">
            <div className="form-container">
                <h1>Create Your Game</h1>
                <fieldset>
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="gameTitle">Game Title*</label>
                        <input
                            type="text"
                            id="gameTitle"
                            value={gameTitle}
                            onChange={(e) => setGameTitle(e.target.value)}
                            placeholder="Enter game title"
                            required
                        />

                        <label htmlFor="genre">Genre*</label>
                        <select id="genre" value={genre} onChange={(e) => setGenre(e.target.value)}>
                            <option value="Fantasy">Fantasy</option>
                            <option value="Sci-Fi">Sci-Fi</option>
                            <option value="Horror">Horror</option>
                            <option value="Mystery">Mystery</option>
                            <option value="Other">Other</option>
                        </select>

                        <label htmlFor="setting">Setting*</label>
                        <textarea
                            id="setting"
                            value={setting}
                            onChange={(e) => setSetting(e.target.value)}
                            placeholder="Describe the game world..."
                            required
                        ></textarea>

                        <label htmlFor="tone">Tone*</label>
                        <select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                            <option value="Serious">Serious</option>
                            <option value="Funny">Funny</option>
                            <option value="Dark">Dark</option>
                            <option value="Epic">Epic</option>
                        </select>

                        <label htmlFor="mainCharacter">Main Character*</label>
                        <input
                            type="text"
                            id="mainCharacter"
                            value={mainCharacter}
                            onChange={(e) => setMainCharacter(e.target.value)}
                            placeholder="e.g. A rogue wizard named Kaelen"
                            required
                        />

                        <label htmlFor="goal">Goal*</label>
                        <input
                            type="text"
                            id="goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g. To recover a lost artifact"
                            required
                        />

                        <div className="form-buttons">
                            <button type="reset" onClick={handleReset}>
                                Reset
                            </button>
                            <button type="submit" className="submit-btn" disabled={loadingIntro}>
                                {loadingIntro ? "Generating…" : "Generate Intro"}
                            </button>
                        </div>
                    </form>
                </fieldset>
            </div>
        </div>
    );
}
