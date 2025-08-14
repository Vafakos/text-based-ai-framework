from dotenv import load_dotenv
from ai_provider import gen_intro, gen_outcomes

load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/generate-game", methods=["POST"])
def generate_game():
    data = request.get_json() or {}
    intro = gen_intro(
        data.get("gameTitle", "Untitled Game"),
        data.get("genre", ""),
        data.get("setting", ""),
        data.get("tone", ""),
        data.get("mainCharacter", ""),
        data.get("goal", ""),
    )
    return jsonify({"intro": intro, "gameData": data})


@app.route("/api/generate-outcomes", methods=["POST"])
def generate_outcomes():
    data = request.get_json() or {}
    scene = data.get("scene", "")
    choices = data.get("choices", [])
    outcomes = gen_outcomes(scene, choices)
    return jsonify({"outcomes": outcomes})


@app.route("/api/generate-narrative", methods=["POST"])
def generate_narrative():
    data = request.get_json()
    parent_text = data.get("parentText", "")
    choice_text = data.get("choiceText", "")
    outcome_text = data.get("outcomeText", "")

    # TODO: Replace this with a real AI call!
    narrative = (
        f"After '{choice_text}', {outcome_text.lower()} "
        f"(based on the previous scene: {parent_text[:60]}...)"
    )

    return jsonify({"narrative": narrative})


if __name__ == "__main__":
    app.run(debug=True)
