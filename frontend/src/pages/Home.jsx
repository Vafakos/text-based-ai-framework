import { useNavigate, Link } from "react-router";
import "../styles/Home.css";

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-content">
                    <h1>Text-Based AI Framework</h1>
                    <p>Craft your experience, share your stories.</p>
                </div>
                <button onClick={() => navigate("/form")}>Create your adventure</button>
                <Link className="btn-primary" to="/public-play">
                    Play a Story
                </Link>
            </section>

            <section className="description">
                <p>
                    A fully AI-driven framework that lets you create interactive text-based
                    adventures without writing a single line of code. Design branching storylines,
                    craft unique characters, and bring your narrative to life—AI handles the heavy
                    lifting.
                </p>
            </section>
        </div>
    );
}
