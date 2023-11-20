import whisper
from flask import Flask
from flask import Flask, jsonify, request
from flask_cors import CORS
import os


app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "max_age": 30}
    },
)
app.config["CORS_HEADERS"] = "Content-Type"

model = whisper.load_model("tiny")


@app.route("/", methods=["GET"])
def helloWorld():
    print("HelloWorld!")
    return "HelloWorld!"


@app.route("/transcribe", methods=["POST"])
def hello():
    if "audio" not in request.files:
        return "No audio file uploaded.", 400

    audio_file = request.files["audio"]
    # Create the directory if it doesn't exist
    if not os.path.exists("./audio"):
        os.makedirs("./audio")

    # Save the uploaded audio file to the server
    audio_path = os.path.join("./audio", audio_file.filename)
    audio_file.save(audio_path)
    result = model.transcribe(audio_path)
    transcription = result["text"]
    print(transcription)
    os.remove(audio_path)
    return transcription


if __name__ == "__main__":
    app.run("0.0.0.0", 5001)
