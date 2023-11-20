# Speech-to-Text API using Flask and Whisper

This project provides a simple Speech-to-Text API using Flask, a web framework for Python, and the Whisper automatic speech recognition (ASR) model. It allows users to send audio files to the server, which will transcribe the spoken content and return the text result.

## Setup

### Prerequisites

- Python 3.x
- Flask
- Whisper ASR Model
- CORS (Cross-Origin Resource Sharing) support

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. Install dependencies:

   ```bash
   pip install flask flask-cors whisper
   ```

3. Download the Whisper ASR model and place it in the project directory.

## Usage

1. Run the Flask application:

   ```bash
   python app.py
   ```

2. The server will be accessible at `http://0.0.0.0:5001/`.

3. Test the API by sending a POST request to the `/transcribe` endpoint with an audio file attached.

   Example using `curl`:

   ```bash
   curl -X POST -F "audio=@path/to/your/audio/file.wav" http://0.0.0.0:5001/transcribe
   ```

   Replace `"path/to/your/audio/file.wav"` with the actual path to your audio file.

## API Endpoints

### 1. Transcribe Audio

- **Endpoint:** `/transcribe`
- **Method:** POST
- **Parameters:**
  - `audio`: The audio file to be transcribed (multipart/form-data)
- **Response:**
  - Successful response returns the transcribed text.

### 2. Hello World

- **Endpoint:** `/`
- **Method:** GET
- **Response:**
  - Returns a simple "HelloWorld!" message.

## CORS Configuration

The application is configured to handle Cross-Origin Resource Sharing (CORS) to allow requests from different origins.

## Directory Structure

- `app.py`: The main Flask application file.
- `audio/`: Directory to store temporarily uploaded audio files.

## Notes

- The Whisper ASR model should be downloaded and placed in the project directory.
- The server runs on `http://0.0.0.0:5001/` by default.

Feel free to customize and extend this project based on your specific requirements.
