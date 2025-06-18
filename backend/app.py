from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/api/generate-game", methods=["POST"])
def generate_game():
    data = request.get_json()
    print("Received data from frontend:", data)
    return jsonify({"message": "Backend received the data!", "data": data})


if __name__ == "__main__":
    app.run(debug=True)
