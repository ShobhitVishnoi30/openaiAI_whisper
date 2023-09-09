/**
 * UseWhisperConfig type
 */
const UseWhisperConfig = {
  apiKey: "",
  autoStart: false,
  autoTranscribe: true,
  mode: "transcriptions",
  nonStop: false,
  removeSilence: false,
  stopTimeout: undefined,
  streaming: false,
  timeSlice: undefined,
  whisperConfig: undefined,
  onDataAvailable: undefined,
  onTranscribe: undefined,
};

/**
 * UseWhisperTimeout type
 */
const UseWhisperTimeout = {
  stop: undefined,
};

/**
 * UseWhisperTranscript type
 */
const UseWhisperTranscript = {
  blob: undefined,
  text: undefined,
};

/**
 * UseWhisperReturn type
 */
const UseWhisperReturn = {
  recording: false,
  speaking: false,
  transcribing: false,
  transcript: UseWhisperTranscript,
  pauseRecording: async () => {},
  startRecording: async () => {},
  stopRecording: async () => {},
};

/**
 * UseWhisperHook type
 */
const UseWhisperHook = (config) => UseWhisperReturn;

/**
 * WhisperApiConfig type
 */
const WhisperApiConfig = {
  model: "whisper-1",
  prompt: "",
  response_format: "json",
  temperature: undefined,
  language: undefined,
};

export {
  UseWhisperConfig,
  UseWhisperTimeout,
  UseWhisperTranscript,
  UseWhisperReturn,
  UseWhisperHook,
  WhisperApiConfig,
};
