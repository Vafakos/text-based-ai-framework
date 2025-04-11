import React, { useState } from "react";
import "../styles/Form.css";

export default function Form() {
    const [gameTitle, setGameTitle] = useState("");
    const [genre, setGenre] = useState("Fantasy");
    const [setting, setSetting] = useState("");
    const [tone, setTone] = useState("Serious");
    const [mainCharacter, setMainCharacter] = useState("");
    const [goal, setGoal] = useState("");
    const [puzzlesEnabled, setPuzzlesEnabled] = useState(false);
    const [npcEnabled, setNpcEnabled] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(
            gameTitle,
            genre,
            setting,
            tone,
            mainCharacter,
            goal,
            puzzlesEnabled,
            npcEnabled
        );
        // Add your form submission logic here (e.g. save or send to AI)
    };

    const handleReset = () => {
        setGameTitle("");
        setGenre("Fantasy");
        setSetting("");
        setTone("Serious");
        setMainCharacter("");
        setGoal("");
        setPuzzlesEnabled(false);
        setNpcEnabled(false);
    };

    return (
        <div className="game-form">
            <div className="App">
                <h1>Create Your Game</h1>
                <fieldset>
                    <form action="#" method="get">
                        <label htmlFor="gameTitle">Game Title*</label>
                        <input
                            type="text"
                            name="gameTitle"
                            id="gameTitle"
                            value={gameTitle}
                            onChange={(e) => setGameTitle(e.target.value)}
                            placeholder="Enter game title"
                            required
                        />

                        <label htmlFor="genre">Genre*</label>
                        <select
                            name="genre"
                            id="genre"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                        >
                            <option value="Fantasy">Fantasy</option>
                            <option value="Sci-Fi">Sci-Fi</option>
                            <option value="Horror">Horror</option>
                            <option value="Mystery">Mystery</option>
                            <option value="Other">Other</option>
                        </select>

                        <label htmlFor="setting">Setting*</label>
                        <textarea
                            name="setting"
                            id="setting"
                            cols="30"
                            rows="4"
                            value={setting}
                            onChange={(e) => setSetting(e.target.value)}
                            placeholder="Describe the game world..."
                            required
                        ></textarea>

                        <label htmlFor="tone">Tone*</label>
                        <select
                            name="tone"
                            id="tone"
                            value={tone}
                            onChange={(e) => setTone(e.target.value)}
                        >
                            <option value="Serious">Serious</option>
                            <option value="Funny">Funny</option>
                            <option value="Dark">Dark</option>
                            <option value="Epic">Epic</option>
                        </select>

                        <label htmlFor="mainCharacter">Main Character*</label>
                        <input
                            type="text"
                            name="mainCharacter"
                            id="mainCharacter"
                            value={mainCharacter}
                            onChange={(e) => setMainCharacter(e.target.value)}
                            placeholder="e.g. A rogue wizard named Kaelen"
                            required
                        />

                        <label htmlFor="goal">Goal*</label>
                        <input
                            type="text"
                            name="goal"
                            id="goal"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="e.g. To recover a lost artifact"
                            required
                        />

                        <label>
                            <input
                                type="checkbox"
                                name="puzzlesEnabled"
                                checked={puzzlesEnabled}
                                onChange={() => setPuzzlesEnabled(!puzzlesEnabled)}
                            />
                            Enable AI-Generated Puzzles
                        </label>

                        <label>
                            <input
                                type="checkbox"
                                name="npcEnabled"
                                checked={npcEnabled}
                                onChange={() => setNpcEnabled(!npcEnabled)}
                            />
                            Enable AI-Generated NPC Dialogues
                        </label>

                        <br />
                        <button type="reset" value="reset" onClick={handleReset}>
                            Reset
                        </button>
                        <button type="submit" value="Submit" onClick={handleSubmit}>
                            Submit
                        </button>
                    </form>
                </fieldset>
            </div>
        </div>
    );
}
