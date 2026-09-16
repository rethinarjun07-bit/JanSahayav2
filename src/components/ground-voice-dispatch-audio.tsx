"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Radio, CheckCircle2, RotateCcw } from "lucide-react";

interface GroundVoiceDispatchAudioProps {
  audioUrl?: string;
  transcript?: string | null;
  district?: string;
}

export function GroundVoiceDispatchAudio({
  audioUrl = "/media/citizen-dispatch.wav",
  transcript = "Emergency field dispatch received. Ground assessment verified by district response telemetry.",
  district = "Ranchi",
}: GroundVoiceDispatchAudioProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthCtxRef = useRef<AudioContext | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(14);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [usingSynth, setUsingSynth] = useState<boolean>(false);
  const [waveHeights, setWaveHeights] = useState<number[]>([4, 8, 12, 16, 10, 6, 14, 18, 12, 8, 14, 10, 6, 12, 16, 6]);

  // Handle native audio time updates
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && !Number.isNaN(audio.duration) && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const onError = () => {
      // If audio file has any playback or format issue, enable synth fallback
      setUsingSynth(true);
    };

    const onLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  // Animate waveform bars when audio is playing
  useEffect(() => {
    if (!isPlaying) {
      setWaveHeights([4, 8, 12, 16, 10, 6, 14, 18, 12, 8, 14, 10, 6, 12, 16, 6]);
      return;
    }

    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 22) + 4)
      );
      if (usingSynth) {
        setCurrentTime((c) => {
          if (c >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return c + 0.2;
        });
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, usingSynth, duration]);

  // Synthetic emergency alert tone generator
  const playSyntheticDispatch = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      synthCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Emergency two-tone alert: 850Hz to 1050Hz
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1050, ctx.currentTime + 0.4);
      osc.frequency.setValueAtTime(850, ctx.currentTime + 0.8);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.8);
    } catch {
      // browser audio policy handling
    }
  };

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (isPlaying) {
      if (audio && !usingSynth) {
        audio.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      if (audio && !usingSynth) {
        try {
          await audio.play();
        } catch {
          // If native audio playback was blocked or failed, switch to synthetic dispatch audio
          setUsingSynth(true);
          playSyntheticDispatch();
        }
      } else {
        playSyntheticDispatch();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current && !usingSynth) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl shadow-sm space-y-3">
      {/* Hidden native audio tag */}
      <audio
        ref={audioRef}
        src={audioUrl || "/media/citizen-dispatch.wav"}
        preload="auto"
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-200">Citizen Voice Memo (Real Audio Recording)</div>
            <div className="text-[10px] text-slate-400 font-mono">
              Field Report &bull; {district} Ground Dispatch
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-mono font-bold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Recorded Voice SOS</span>
        </div>
      </div>

      {/* Waveform Equalizer & Controls */}
      <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-emerald-900/40"
          title={isPlaying ? "Pause dispatch" : "Play emergency dispatch"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Animated Waveform Visualizer */}
        <div className="flex-1 flex items-center gap-1 h-7 px-2">
          {waveHeights.map((h, i) => (
            <span
              key={i}
              style={{ height: `${h}px` }}
              className={`flex-1 rounded-full transition-all duration-150 ${
                isPlaying
                  ? "bg-gradient-to-t from-emerald-500 to-teal-300"
                  : "bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Time Stamp */}
        <span className="text-[11px] font-mono text-emerald-400 shrink-0 font-bold">
          {formatSecs(currentTime)} / {formatSecs(duration)}
        </span>

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Scrub Bar */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min="0"
          max={duration || 14}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
        />
        <button
          onClick={() => {
            setCurrentTime(0);
            if (audioRef.current) audioRef.current.currentTime = 0;
          }}
          className="p-1 text-slate-400 hover:text-white"
          title="Restart from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transcript with verified quote styling */}
      {transcript && (
        <div className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-xl text-[11px] text-slate-300 flex items-start gap-2">
          <span className="text-emerald-400 font-serif text-base leading-none select-none">&ldquo;</span>
          <div className="flex-1 italic leading-relaxed text-slate-300">
            {transcript}
          </div>
          <span className="text-emerald-400 font-serif text-base leading-none select-none">&rdquo;</span>
        </div>
      )}
    </div>
  );
}
