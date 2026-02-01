"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_DURATION_MS = 3 * 60 * 1000; // 3 minutes

function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceBar() {
  const [status, setStatus] = useState<"idle" | "recording" | "recorded">("idle");
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const playbackAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTickRef = useRef<number | null>(null);
  const isSeekingRef = useRef(false);
  const playbackDurationRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const volumeAnimationRef = useRef<number | null>(null);

  const stopVolumeMeter = useCallback(() => {
    if (volumeAnimationRef.current != null) {
      cancelAnimationFrame(volumeAnimationRef.current);
      volumeAnimationRef.current = null;
    }
    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;
    analyserRef.current = null;
    setVolumeLevel(0);
  }, []);

  const stopRecording = useCallback(() => {
    stopVolumeMeter();
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === "recording") {
      mr.stop();
    }
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [stopVolumeMeter]);

  const startRecording = useCallback(async () => {
    setPlaybackError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setStatus("recorded");
      };

      recorder.onerror = () => {
        setStatus("idle");
        stream.getTracks().forEach((t) => t.stop());
      };

      // Volume meter: AudioContext + AnalyserNode from same stream
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.resume();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (analyserRef.current && audioContextRef.current?.state === "running") {
          analyserRef.current.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const average = sum / dataArray.length;
          const normalized = Math.min(100, Math.round((average / 255) * 100 * 1.5));
          setVolumeLevel(normalized);
        }
        volumeAnimationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      recorder.start(1000);
      setStatus("recording");
      setRecordingElapsed(0);
      setVolumeLevel(0);
      startTimeRef.current = Date.now();

      const elapsedInterval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setRecordingElapsed(elapsed);
      }, 500);
      elapsedIntervalRef.current = elapsedInterval;

      const stopTimeout = setTimeout(() => {
        stopRecording();
      }, MAX_DURATION_MS);
      stopTimeoutRef.current = stopTimeout;
    } catch (err) {
      setPlaybackError(
        err instanceof Error ? err.message : "Could not access microphone"
      );
    }
  }, [stopRecording]);

  const handleDelete = useCallback(() => {
    if (playbackAudioRef.current) {
      playbackAudioRef.current.pause();
      playbackAudioRef.current.src = "";
      playbackAudioRef.current = null;
    }
    setPlaybackCurrentTime(0);
    setPlaybackDuration(0);
    setIsPlaying(false);
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      setRecordedBlobUrl(null);
    }
    setStatus("idle");
    setPlaybackError(null);
  }, [recordedBlobUrl]);

  // Keep duration ref in sync for seek handler
  useEffect(() => {
    playbackDurationRef.current = playbackDuration;
  }, [playbackDuration]);

  // Decode blob to get duration (HTMLAudioElement often reports NaN for webm blobs)
  useEffect(() => {
    if (!recordedBlobUrl) return;
    let cancelled = false;
    const ctx = new AudioContext();
    fetch(recordedBlobUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => ctx.decodeAudioData(buffer))
      .then((decoded) => {
        if (!cancelled && Number.isFinite(decoded.duration) && decoded.duration > 0) {
          setPlaybackDuration(decoded.duration);
          playbackDurationRef.current = decoded.duration;
        }
      })
      .catch(() => {})
      .finally(() => ctx.close());
    return () => {
      cancelled = true;
    };
  }, [recordedBlobUrl]);

  // Create audio element and attach listeners when we have a recording
  useEffect(() => {
    if (!recordedBlobUrl) return;
    const audio = new Audio(recordedBlobUrl);
    playbackAudioRef.current = audio;

    const syncDuration = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setPlaybackDuration(audio.duration);
      }
    };

    const onLoadedMetadata = syncDuration;
    const onLoadedData = syncDuration;
    const onDurationChange = syncDuration;
    const onCanPlay = syncDuration;

    const onTimeUpdate = () => {
      syncDuration();
      if (!isSeekingRef.current) setPlaybackCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("loadeddata", onLoadedData);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("loadeddata", onLoadedData);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.pause();
      audio.src = "";
      playbackAudioRef.current = null;
    };
  }, [recordedBlobUrl]);

  // Smooth progress update while playing (timeupdate can be sparse)
  useEffect(() => {
    if (!isPlaying) return;
    const audio = playbackAudioRef.current;
    if (!audio) return;

    const tick = () => {
      if (playbackAudioRef.current && !isSeekingRef.current) {
        setPlaybackCurrentTime(playbackAudioRef.current.currentTime);
      }
      playbackTickRef.current = requestAnimationFrame(tick);
    };
    playbackTickRef.current = requestAnimationFrame(tick);
    return () => {
      if (playbackTickRef.current) {
        cancelAnimationFrame(playbackTickRef.current);
        playbackTickRef.current = null;
      }
    };
  }, [isPlaying]);

  const togglePlayback = useCallback(() => {
    const audio = playbackAudioRef.current;
    if (!audio) return;
    setPlaybackError(null);
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((e) =>
        setPlaybackError(e instanceof Error ? e.message : "Playback failed")
      );
    }
  }, [isPlaying]);

  const skipBack = useCallback(() => {
    const audio = playbackAudioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    setPlaybackCurrentTime(audio.currentTime);
  }, []);

  const skipForward = useCallback(() => {
    const audio = playbackAudioRef.current;
    if (!audio) return;
    const duration =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : playbackDurationRef.current;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
    setPlaybackCurrentTime(audio.currentTime);
  }, []);

  const handleRangeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const audio = playbackAudioRef.current;
      const pct = Number(e.target.value);
      const duration = playbackDurationRef.current;
      if (!audio || !Number.isFinite(duration) || duration <= 0) return;
      const time = (pct / 100) * duration;
      audio.currentTime = time;
      setPlaybackCurrentTime(time);
    },
    []
  );

  const handleRangePointerDown = useCallback(() => {
    isSeekingRef.current = true;
  }, []);

  const handleRangePointerUp = useCallback(() => {
    isSeekingRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
      if (recordedBlobUrl) URL.revokeObjectURL(recordedBlobUrl);
    };
  }, [stopRecording, recordedBlobUrl]);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-10 flex justify-center px-4 pb-6 pt-2"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto w-full max-w-2xl rounded-2xl bg-base-100 px-6 py-5 shadow-lg ring-1 ring-base-300/40">
        {playbackError && (
          <p className="mb-3 text-center text-sm text-error" role="alert">
            {playbackError}
          </p>
        )}

        {status === "idle" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm font-medium text-base-content/80">
              Speak your day
            </p>
            <button
              type="button"
              onClick={startRecording}
              className="flex size-24 shrink-0 items-center justify-center rounded-full bg-primary text-primary-content shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-base-100"
              aria-label="Start recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-12"
                aria-hidden
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
            <p className="text-center text-xs text-base-content/50">
              Up to 3 minutes
            </p>
          </div>
        )}

        {status === "recording" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center text-sm font-medium text-base-content/80">
              Recording…
            </p>
            <progress
              className="progress progress-primary w-full max-w-xs"
              value={volumeLevel}
              max={100}
              aria-label="Volume level"
            />
            <p className="font-mono text-lg tabular-nums text-base-content/70">
              {formatTime(recordingElapsed)} / 3:00
            </p>
            <button
              type="button"
              onClick={stopRecording}
              className="flex size-24 shrink-0 items-center justify-center rounded-full bg-error text-error-content shadow-lg transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-error/40 focus:ring-offset-2 focus:ring-offset-base-100"
              aria-label="Stop recording"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-12"
                aria-hidden
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
            <p className="text-center text-xs text-base-content/50">
              Tap to stop · Auto-stops at 3 min
            </p>
          </div>
        )}

        {status === "recorded" && recordedBlobUrl && (
          <div className="flex flex-col items-center gap-3 text-primary">
            <p className="text-center text-sm font-medium text-base-content/80">
              Recording ready
            </p>
            <div className="w-full max-w-xs">
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={
                  playbackDuration > 0
                    ? Math.min(
                        100,
                        (playbackCurrentTime / playbackDuration) * 100
                      )
                    : 0
                }
                onChange={handleRangeChange}
                onPointerDown={handleRangePointerDown}
                onPointerUp={handleRangePointerUp}
                onPointerLeave={handleRangePointerUp}
                className="range range-primary w-full"
                aria-label="Seek"
              />
            </div>
            <p className="font-mono text-sm tabular-nums text-base-content/70">
              {formatTime(playbackCurrentTime * 1000)} /{" "}
              {Number.isFinite(playbackDuration) && playbackDuration > 0
                ? formatTime(playbackDuration * 1000)
                : "--:--"}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={skipBack}
                className="flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Back 10 seconds"
                title="Back 10 seconds"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7C8473" className="size-8 text-base-content/80" aria-hidden><g fill="none" stroke="#7C8473" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" color="currentColor"><path d="m12 5l-1.104-1.545c-.41-.576-.617-.864-.487-1.13c.13-.268.46-.283 1.12-.314Q11.763 2 12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12a9.99 9.99 0 0 1 4-8"/><path d="M7.992 11.004C8.52 10.584 9 9.89 9.3 10.02c.3.128.204.552.204 1.212v4.776m6.498-3.408c0-1.38.066-1.752-.198-2.196s-.924-.406-1.584-.406s-1.14-.038-1.458.322c-.39.42-.222 1.2-.27 2.28c.108 1.44-.186 2.58.264 3.06c.324.396.9.336 1.584.348c.68-.008 1.092.024 1.428-.36c.372-.336.192-1.668.234-3.048"/></g></svg>
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                className="btn btn-ghost btn-circle size-14"
                aria-label={isPlaying ? "Pause" : "Play recording"}
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-8"
                    aria-hidden
                  >
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-8"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={skipForward}
                className="flex flex-col items-center gap-0.5 rounded-xl p-2 transition-colors hover:bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Forward 10 seconds"
                title="Forward 10 seconds"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#7C8473" className="size-8 text-base-content/80" aria-hidden>
                  <path fill-rule="evenodd" d="M1.25 12C1.25 6.063 6.063 1.25 12 1.25a.75.75 0 0 1 .586 1.219l-2 2.5a.75.75 0 0 1-1.172-.938l.903-1.128A9.251 9.251 0 0 0 2.75 12A9.25 9.25 0 1 0 15.7 3.52a.75.75 0 0 1 .6-1.375A10.752 10.752 0 0 1 22.75 12c0 5.937-4.813 10.75-10.75 10.75S1.25 17.937 1.25 12Zm9.075-4.176a.75.75 0 0 1 .425.676v7a.75.75 0 0 1-1.5 0v-5.44l-1.281 1.026a.75.75 0 0 1-.938-1.172l2.5-2a.75.75 0 0 1 .794-.09ZM14.25 9.25a1 1 0 0 0-1 1v3.5a1 1 0 1 0 2 0v-3.5a1 1 0 0 0-1-1Zm-2.5 1a2.5 2.5 0 0 1 5 0v3.5a2.5 2.5 0 0 1-5 0v-3.5Z" clip-rule="evenodd"/>
                </svg>
              </button>
            </div>
            <div className="flex flex-col items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-ghost btn-error gap-2 text-error"
                aria-label="Delete and record again"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-5"
                  aria-hidden
                >
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Delete
              </button>
              <p className="text-center text-xs text-secondary">
                Listen or delete to record again
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
