import { useEffectAsync, useMemoAsync } from "@chengsokdara/react-hooks-async";
import { useEffect, useRef, useState } from "react";
import {
  defaultStopTimeout,
  ffmpegCoreUrl,
  silenceRemoveCommand,
  whisperApiEndpoint,
} from "./configs";

/**
 * default useWhisper configuration
 */
const defaultConfig = {
  apiKey: "",
  autoStart: false,
  autoTranscribe: true,
  mode: "transcriptions",
  nonStop: false,
  removeSilence: false,
  stopTimeout: defaultStopTimeout,
  streaming: false,
  timeSlice: 1000,
  onDataAvailable: undefined,
  onTranscribe: undefined,
};

/**
 * default timeout for recorder
 */
const defaultTimeout = {
  stop: undefined,
};

/**
 * default transcript object
 */
const defaultTranscript = {
  blob: undefined,
  text: undefined,
};

/**
 * React Hook for OpenAI Whisper
 */
export const useWhisper = (config) => {
  const {
    apiKey,
    autoStart,
    autoTranscribe,
    mode,
    nonStop,
    removeSilence,
    stopTimeout,
    streaming,
    timeSlice,
    whisperConfig,
    onDataAvailable: onDataAvailableCallback,
    onTranscribe: onTranscribeCallback,
  } = {
    ...defaultConfig,
    ...config,
  };

  // if (!apiKey && !onTranscribeCallback) {
  //   throw new Error("apiKey is required if onTranscribe is not provided");
  // }

  const chunks = useRef([]);
  const encoder = useRef();
  const listener = useRef();
  const recorder = useRef();
  const stream = useRef();
  const timeout = useRef(defaultTimeout);

  const [recording, setRecording] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState(defaultTranscript);

  useEffect(() => {
    return () => {
      if (chunks.current) {
        chunks.current = [];
      }
      if (encoder.current) {
        encoder.current.flush();
        encoder.current = undefined;
      }
      if (recorder.current) {
        recorder.current.destroy();
        recorder.current = undefined;
      }
      onStopTimeout("stop");
      if (listener.current) {
        // @ts-ignore
        listener.current.off("speaking", onStartSpeaking);
        // @ts-ignore
        listener.current.off("stopped_speaking", onStopSpeaking);
      }
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
        stream.current = undefined;
      }
    };
  }, []);

  useEffect(() => {
    const startRecording = async () => {
      await onStartRecording();
    };

    const pauseRecording = async () => {
      await onPauseRecording();
    };

    const stopRecording = async () => {
      await onStopRecording();
    };

    if (autoStart) {
      startRecording();
    }

    return () => {
      pauseRecording();
    };
  }, [autoStart]);

  const startRecording = async () => {
    await onStartRecording();
  };

  const pauseRecording = async () => {
    await onPauseRecording();
  };

  const stopRecording = async () => {
    await onStopRecording();
  };

  const onStartRecording = async () => {
    try {
      console.log(stream.current);
      if (!stream.current) {
        await onStartStreaming();
      }
      if (stream.current) {
        console.log("not heree--------------");
        if (!recorder.current) {
          const {
            default: { RecordRTCPromisesHandler, StereoAudioRecorder },
          } = await import("recordrtc");
          const recorderConfig = {
            mimeType: "audio/wav",
            numberOfAudioChannels: 1, // mono
            recorderType: StereoAudioRecorder,
            sampleRate: 44100, // Sample rate = 44.1khz
            timeSlice: streaming ? timeSlice : undefined,
            type: "audio",
            ondataavailable:
              autoTranscribe && streaming ? onDataAvailable : undefined,
          };
          recorder.current = new RecordRTCPromisesHandler(
            stream.current,
            recorderConfig
          );
        }
        if (!encoder.current) {
          const { Mp3Encoder } = await import("lamejs");
          encoder.current = new Mp3Encoder(1, 44100, 96);
        }
        const recordState = await recorder.current.getState();
        if (recordState === "inactive" || recordState === "stopped") {
          await recorder.current.startRecording();
        }
        if (recordState === "paused") {
          await recorder.current.resumeRecording();
        }
        if (nonStop) {
          onStartTimeout("stop");
        }
        setRecording(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onStartStreaming = async () => {
    try {
      if (stream.current) {
        stream.current.getTracks().forEach((track) => track.stop());
      }
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!listener.current) {
        const { default: hark } = await import("hark");
        listener.current = hark(stream.current, {
          interval: 500,
          play: false,
        });
        listener.current.on("speaking", onStartSpeaking);
        listener.current.on("stopped_speaking", onStopSpeaking);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onStartTimeout = (type) => {
    if (!timeout.current[type]) {
      timeout.current[type] = setTimeout(onStopRecording, stopTimeout);
    }
  };

  const onStartSpeaking = () => {
    console.log("start speaking");
    setSpeaking(true);
    onStopTimeout("stop");
  };

  const onStopSpeaking = () => {
    console.log("stop speaking");
    setSpeaking(false);
    if (nonStop) {
      onStartTimeout("stop");
    }
  };

  const onPauseRecording = async () => {
    try {
      if (recorder.current) {
        const recordState = await recorder.current.getState();
        if (recordState === "recording") {
          await recorder.current.pauseRecording();
        }
        onStopTimeout("stop");
        setRecording(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onStopRecording = async () => {
    try {
      if (recorder.current) {
        const recordState = await recorder.current.getState();
        if (recordState === "recording" || recordState === "paused") {
          await recorder.current.stopRecording();
        }
        onStopStreaming();
        onStopTimeout("stop");
        setRecording(false);
        if (autoTranscribe) {
          await onTranscribing();
        } else {
          const blob = await recorder.current.getBlob();
          setTranscript({
            blob,
          });
        }
        await recorder.current.destroy();
        chunks.current = [];
        if (encoder.current) {
          encoder.current.flush();
          encoder.current = undefined;
        }
        recorder.current = undefined;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onStopStreaming = () => {
    if (listener.current) {
      // @ts-ignore
      listener.current.off("speaking", onStartSpeaking);
      // @ts-ignore
      listener.current.off("stopped_speaking", onStopSpeaking);
      listener.current = undefined;
    }
    if (stream.current) {
      stream.current.getTracks().forEach((track) => track.stop());
      stream.current = undefined;
    }
  };

  const onStopTimeout = (type) => {
    if (timeout.current[type]) {
      clearTimeout(timeout.current[type]);
      timeout.current[type] = undefined;
    }
  };

  const onTranscribing = async () => {
    console.log("transcribing speech");
    try {
      if (encoder.current && recorder.current) {
        const recordState = await recorder.current.getState();
        if (recordState === "stopped") {
          setTranscribing(true);
          let blob = await recorder.current.getBlob();
          if (removeSilence) {
            const { createFFmpeg } = await import("@ffmpeg/ffmpeg");
            const ffmpeg = createFFmpeg({
              mainName: "main",
              corePath: ffmpegCoreUrl,
              log: true,
            });
            if (!ffmpeg.isLoaded()) {
              await ffmpeg.load();
            }
            const buffer = await blob.arrayBuffer();
            console.log({ in: buffer.byteLength });
            ffmpeg.FS("writeFile", "in.wav", new Uint8Array(buffer));
            await ffmpeg.run(
              "-i", // Input
              "in.wav",
              "-acodec", // Audio codec
              "libmp3lame",
              "-b:a", // Audio bitrate
              "96k",
              "-ar", // Audio sample rate
              "44100",
              "-af", // Audio filter = remove silence from start to end with 2 seconds in between
              silenceRemoveCommand,
              "out.mp3" // Output
            );
            const out = ffmpeg.FS("readFile", "out.mp3");
            console.log({ out: out.buffer.byteLength });
            // 225 seems to be empty mp3 file
            if (out.length <= 225) {
              ffmpeg.exit();
              setTranscript({
                blob,
              });
              setTranscribing(false);
              return;
            }
            blob = new Blob([out.buffer], { type: "audio/mpeg" });
            ffmpeg.exit();
          } else {
            const buffer = await blob.arrayBuffer();
            console.log({ wav: buffer.byteLength });
            const mp3 = encoder.current.encodeBuffer(new Int16Array(buffer));
            blob = new Blob([mp3], { type: "audio/mpeg" });
            console.log({ blob, mp3: mp3.byteLength });
          }
          if (typeof onTranscribeCallback === "function") {
            const transcribed = await onTranscribeCallback(blob);
            console.log("onTranscribe ===========>>>>>>>>", transcribed);
            setTranscript(transcribed);
          } else {
            const file = new File([blob], "speech.mp3", { type: "audio/mpeg" });
            const text = await onWhispered(file);
            console.log("onTranscribing ==============> ", { text });
            setTranscript({
              blob,
              text,
            });
          }
          setTranscribing(false);
        }
      }
    } catch (err) {
      console.info(err);
      setTranscribing(false);
    }
  };

  const onDataAvailable = async (data) => {
    console.log("onDataAvailable", data);
    try {
      if (streaming && recorder.current) {
        onDataAvailableCallback?.(data);
        if (encoder.current) {
          const buffer = await data.arrayBuffer();
          const mp3chunk = encoder.current.encodeBuffer(new Int16Array(buffer));
          const mp3blob = new Blob([mp3chunk], { type: "audio/mpeg" });
          chunks.current.push(mp3blob);
        }
        const recorderState = await recorder.current.getState();
        if (recorderState === "recording") {
          const blob = new Blob(chunks.current, {
            type: "audio/mpeg",
          });
          const file = new File([blob], "speech.mp3", {
            type: "audio/mpeg",
          });
          console.log("comming ffrom here \n\n\n\n ");
          const text = await onWhispered(file);
          console.log("onInterim", { text });
          if (text) {
            setTranscript((prev) => ({ ...prev, text }));
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const onWhispered = useMemoAsync(
    async (file) => {
      // Whisper only accept multipart/form-data currently
      const formData = new FormData();
      console.log(file);
      formData.append("audio", file);
      console.log("-------------------");
      console.log(formData);
      const headers = {};
      // headers["Content-Type"] = "multipart/form-data";
      // if (apiKey) {
      //   headers["Authorization"] = `Bearer ${apiKey}`;
      // }
      const { default: axios } = await import("axios");

      const response = await axios.post(whisperApiEndpoint, formData);
      console.log("here is the data", response);
      return response.data;
    },
    [apiKey, mode, whisperConfig]
  );

  return {
    recording,
    speaking,
    transcribing,
    transcript,
    pauseRecording,
    startRecording,
    stopRecording,
  };
};
