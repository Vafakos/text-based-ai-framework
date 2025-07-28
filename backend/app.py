from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/generate-game", methods=["POST"])
def generate_game():
    data = request.get_json()
    # TODO: Replace this mock intro with AI-powered generation
    print("Received data from frontend:", data)

    title = data.get("gameTitle", "Unknown Adventure")
    genre = data.get("genre", "Unknown Genre")
    setting = data.get("setting", "an unknown place")
    main_character = data.get("mainCharacter", "an unknown hero")

    intro = (
        f"Welcome to '{title}', a {genre} adventure set in {setting}.\n"
        f"You play as {main_character}. Your quest begins now!"
    )

    return jsonify({"intro": intro, "gameData": data})


@app.route("/api/generate-outcomes", methods=["POST"])
def generate_outcomes():
    data = request.get_json()
    scene = data.get("scene", "")
    choices = data.get("choices", [])
    # TODO: Replace mock outcome generation with real AI integration
    outcomes = [
        f"If you choose to '{choice}', here is what happens next in the story..."
        for choice in choices
    ]
    return jsonify({"outcomes": outcomes})


if __name__ == "__main__":
    app.run(debug=True)
