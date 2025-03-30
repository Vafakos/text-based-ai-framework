export default function Home() {
    return (
        <div className="home">
            <header className="top-bar">
                <div className="logo">Text-Based AI Framework</div>
            </header>

            <section className="hero">
                <div className="hero-content">
                    <h1>Text-Based AI Framework</h1>
                    <p>Craft your experience, share your stories.</p>
                </div>
                <button onClick={() => alert("Navigate to Play Page!")}>
                    Create your adventure
                </button>
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
