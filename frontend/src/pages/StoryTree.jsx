import { useLocation, useNavigate } from "react-router";
import "../styles/StoryTree.css";

export default function StoryTree() {
    const location = useLocation();
    const navigate = useNavigate();

    const { intro, formData } = location.state || {};

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
            {/* Here is where the choices will be */}
        </div>
    );
}
