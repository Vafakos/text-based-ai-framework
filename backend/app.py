from dotenv import load_dotenv

load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_provider import gen_intro, gen_outcomes, gen_narrative

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
    data = request.get_json() or {}
    narrative = gen_narrative(
        data.get("parentText", ""),
        data.get("choiceText", ""),
        data.get("outcomeText", ""),
    )
    return jsonify({"narrative": narrative})


if __name__ == "__main__":
    app.run(debug=True)
