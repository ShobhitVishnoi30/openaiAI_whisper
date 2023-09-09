import { useState } from "react";
import { useWhisper } from "./whisper/useWhisper";

const App = () => {
  const {
    recording,
    speaking,
    transcribing,
    transcript,
    pauseRecording,
    startRecording,
    stopRecording,
  } = useWhisper({
    apiKey: "", // YOUR_OPEN_AI_TOKEN
    streaming: true,
    timeSlice: 2_000, // 5 seconds
  });

  const [isTranscriptSent, setIsTranscriptSent] = useState(false);

  const sendTranscript = () => {
    // Replace 'YOUR_API_ENDPOINT' with your actual API endpoint URL
    fetch("", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript: transcript.text }),
    })
      .then((response) => {
        // Handle the response from the API if needed
        console.log("Transcript sent successfully");
        setIsTranscriptSent(true);
      })
      .catch((error) => {
        // Handle any errors that occur during the request
        console.error("Error sending transcript:", error);
      });
  };

  return (
    <div>
      <p>Recording: {recording}</p>
      <p>Speaking: {speaking}</p>
      <p>Transcribing: {transcribing}</p>
      <p>Transcribed Text: {transcript.text}</p>
      <button onClick={() => startRecording()}>Start</button>
      <button onClick={() => pauseRecording()}>Pause</button>
      <button onClick={() => stopRecording()}>Stop</button>
      {transcript.text && !isTranscriptSent && (
        <button onClick={sendTranscript}>Send Transcript</button>
      )}
      {isTranscriptSent && <p>Transcript sent successfully!</p>}
    </div>
  );
};

export default App;
