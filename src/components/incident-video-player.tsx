"use client";

import React, { useRef, useState } from "react";
import { Play, Pause, RotateCcw, Maximize2, Video, Volume2, VolumeX } from "lucide-react";

interface IncidentVideoPlayerProps {
  videoUrl: string;
  posterImage?: string;
  title?: string;
  category?: string;
}

export function IncidentVideoPlayer({
  videoUrl,
  posterImage,
  title = "Field Incident Video",
  category = "Disaster Management",
}: IncidentVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.duration && Number.isFinite(v.duration)) {
      setDuration(v.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const time = parseFloat(e.target.value);
    v.currentTime = time;
    setCurrentTime(time);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="group relative rounded-2xl overflow-hidden border border-slate-300 bg-slate-950 shadow-sm flex flex-col"
    >
      {/* Top Header Bar */}
      <div className="px-3.5 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Video className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-white text-[11px] block leading-tight">
              Citizen Recorded Video Footage
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[200px] block">
              {title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-mono font-bold">
            {category}
          </span>
          <button
            onClick={handleFullscreen}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterImage}
          playsInline
          loop
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current?.duration && Number.isFinite(videoRef.current.duration)) {
              setDuration(videoRef.current.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-contain bg-black cursor-pointer"
          onClick={togglePlay}
        />

        {/* Big Play Overlay when paused */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center cursor-pointer transition-opacity"
          >
            <div className="p-3.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-xl hover:scale-105 transition-transform">
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Video Controls Bar */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-300">
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current" />
          )}
        </button>

        <button
          onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              setCurrentTime(0);
            }
          }}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Restart video"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Timeline Scrub */}
        <input
          type="range"
          min="0"
          max={duration || 10}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {/* Time code */}
        <span className="text-[11px] font-mono text-slate-300 shrink-0 font-semibold">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
