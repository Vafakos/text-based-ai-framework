from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/generate-game", methods=["POST"])
def generate_game():
    data = request.get_json()
    print("Received data from frontend:", data)

    # bulding a mock intro to test
    title = data.get("gameTitle", "Unknown Adventure")
    genre = data.get("genre", "Unknown Genre")
    setting = data.get("setting", "an unknown place")
    main_character = data.get("mainCharacter", "an unknown hero")

    intro = (
        f"Welcome to '{title}', a {genre} adventure set in {setting}.\n"
        f"You play as {main_character}. Your quest begins now!"
    )

    return jsonify({"intro": intro, "gameData": data})


if __name__ == "__main__":
    app.run(debug=True)
