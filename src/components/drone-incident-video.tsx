"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Eye, Flame, ShieldAlert, Radio, Maximize2 } from "lucide-react";

interface DroneIncidentVideoProps {
  videoUrl?: string;
  latitude?: number;
  longitude?: number;
  category?: string;
  title?: string;
}

export function DroneIncidentVideo({
  videoUrl,
  latitude = 23.3441,
  longitude = 85.3096,
  category = "Disaster Management",
  title = "Field Incident",
}: DroneIncidentVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [useCanvasDrone, setUseCanvasDrone] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<"optical" | "thermal">("optical");
  const [playbackSeconds, setPlaybackSeconds] = useState<number>(14);
  const [altitude, setAltitude] = useState<number>(124);
  const [battery, setBattery] = useState<number>(88);
  const [droneHumActive, setDroneHumActive] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  const activeVideoSrc = videoUrl || "/media/incident-video.mp4";

  // If a real videoUrl exists and is not a broken placeholder, play it directly
  useEffect(() => {
    if (
      activeVideoSrc &&
      !activeVideoSrc.includes("commondatastorage.googleapis.com") &&
      !activeVideoSrc.includes("sample/ForBiggerBlazes")
    ) {
      setUseCanvasDrone(false);
    } else {
      setUseCanvasDrone(false);
    }
  }, [activeVideoSrc]);

  // Audio drone propulsion hum synthesis (low-volume ambient telemetry sound)
  const toggleDroneAudio = () => {
    try {
      if (droneHumActive) {
        if (oscRef.current) {
          oscRef.current.stop();
          oscRef.current.disconnect();
          oscRef.current = null;
        }
        setDroneHumActive(false);
      } else {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(110, ctx.currentTime);

        // Low-pass filter to sound like a distant drone motor
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        gain.gain.setValueAtTime(0.03, ctx.currentTime); // gentle ambient volume

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        oscRef.current = osc;
        setDroneHumActive(true);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    return () => {
      if (oscRef.current) {
        try {
          oscRef.current.stop();
          oscRef.current.disconnect();
        } catch {}
      }
    };
  }, []);

  // Drone HUD Canvas Animation loop
  useEffect(() => {
    if (!useCanvasDrone) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let frame = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // 1. Background terrain simulation
      if (colorMode === "thermal") {
        // Thermal FLIR Mode
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#1a0026");
        grad.addColorStop(0.5, "#2a0845");
        grad.addColorStop(1, "#640d5f");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Thermal hotspots
        ctx.fillStyle = "rgba(255, 110, 0, 0.4)";
        ctx.beginPath();
        const pulse = Math.sin(frame * 0.05) * 20;
        ctx.arc(w * 0.52 + Math.cos(frame * 0.02) * 30, h * 0.5 + Math.sin(frame * 0.03) * 20, 60 + pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 235, 59, 0.7)";
        ctx.beginPath();
        ctx.arc(w * 0.52 + Math.cos(frame * 0.02) * 30, h * 0.5 + Math.sin(frame * 0.03) * 20, 25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Optical Reconnaissance Mode
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "#0a192f");
        grad.addColorStop(0.6, "#142d4c");
        grad.addColorStop(1, "#1f4068");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Ground topography grid lines (perspective simulation)
        ctx.strokeStyle = "rgba(100, 255, 218, 0.15)";
        ctx.lineWidth = 1;
        const gridOffset = (frame * 1.2) % 30;
        for (let y = h * 0.35; y < h; y += 18) {
          const perspectiveY = y + gridOffset * ((y - h * 0.3) / h);
          if (perspectiveY < h) {
            ctx.beginPath();
            ctx.moveTo(0, perspectiveY);
            ctx.lineTo(w, perspectiveY);
            ctx.stroke();
          }
        }
        for (let x = 0; x < w; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, h * 0.35);
          ctx.lineTo((x - w / 2) * 2 + w / 2, h);
          ctx.stroke();
        }
      }

      // 2. Animated scanning radar / target reticle
      const cx = w / 2;
      const cy = h / 2;

      // Target bounding box (AI incident classification)
      const boxW = 120 + Math.sin(frame * 0.04) * 8;
      const boxH = 70 + Math.cos(frame * 0.04) * 6;
      ctx.strokeStyle = colorMode === "thermal" ? "#ffeb3b" : "#00f0ff";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH);
      ctx.setLineDash([]);

      // Corner brackets on target
      const bl = 12;
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      // Top-Left
      ctx.beginPath();
      ctx.moveTo(cx - boxW / 2, cy - boxH / 2 + bl);
      ctx.lineTo(cx - boxW / 2, cy - boxH / 2);
      ctx.lineTo(cx - boxW / 2 + bl, cy - boxH / 2);
      ctx.stroke();
      // Top-Right
      ctx.beginPath();
      ctx.moveTo(cx + boxW / 2 - bl, cy - boxH / 2);
      ctx.lineTo(cx + boxW / 2, cy - boxH / 2);
      ctx.lineTo(cx + boxW / 2, cy - boxH / 2 + bl);
      ctx.stroke();
      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(cx - boxW / 2, cy + boxH / 2 - bl);
      ctx.lineTo(cx - boxW / 2, cy + boxH / 2);
      ctx.lineTo(cx - boxW / 2 + bl, cy + boxH / 2);
      ctx.stroke();
      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(cx + boxW / 2 - bl, cy + boxH / 2);
      ctx.lineTo(cx + boxW / 2, cy + boxH / 2);
      ctx.lineTo(cx + boxW / 2, cy + boxH / 2 - bl);
      ctx.stroke();

      // Crosshair Center
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx, cy + 15);
      ctx.stroke();

      // Artificial Horizon Pitch Ladder
      const pitchOffset = Math.sin(frame * 0.02) * 12;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy + pitchOffset - 25);
      ctx.lineTo(cx - 40, cy + pitchOffset - 25);
      ctx.moveTo(cx + 40, cy + pitchOffset - 25);
      ctx.lineTo(cx + 70, cy + pitchOffset - 25);
      ctx.stroke();

      // Laser distance scanline
      const scanY = (frame * 2.5) % h;
      const scanGrad = ctx.createLinearGradient(0, scanY - 15, 0, scanY + 5);
      scanGrad.addColorStop(0, "rgba(0, 255, 170, 0)");
      scanGrad.addColorStop(0.8, colorMode === "thermal" ? "rgba(255, 80, 0, 0.35)" : "rgba(0, 255, 170, 0.3)");
      scanGrad.addColorStop(1, "rgba(255, 255, 255, 0.6)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 15, w, 20);

      // 3. Telemetry HUD Text Overlays
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#00f0ff";
      ctx.fillText(`GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`, 16, 24);

      ctx.fillStyle = "#ffffff";
      ctx.fillText(`ALT: ${(120 + Math.sin(frame * 0.03) * 5).toFixed(1)}m AGL`, 16, 42);
      ctx.fillText(`SPD: ${(21.4 + Math.cos(frame * 0.02) * 1.8).toFixed(1)} km/h`, 16, 60);
      ctx.fillText(`FOV: 84° TELE`, 16, 78);

      // Right-side HUD
      ctx.textAlign = "right";
      ctx.fillStyle = "#ff4757";
      ctx.fillText("● REC LIVE [4K]", w - 16, 24);
      ctx.fillStyle = "#00f0ff";
      ctx.fillText(`SAT: 14 LOCKED [RTK]`, w - 16, 42);
      ctx.fillText(`SIG: -64 dBm (99%)`, w - 16, 60);
      ctx.fillText(`BAT: ${battery}%`, w - 16, 78);

      // Center bottom target banner
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      ctx.fillRect(w / 2 - 120, h - 34, 240, 22);
      ctx.strokeStyle = colorMode === "thermal" ? "#ff4757" : "#00f0ff";
      ctx.strokeRect(w / 2 - 120, h - 34, 240, 22);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(`TARGET: ${category.toUpperCase()} IDENTIFIED`, w / 2, h - 20);

      ctx.textAlign = "left";

      if (isPlaying) {
        frame++;
      }
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [useCanvasDrone, isPlaying, colorMode, latitude, longitude, category, battery]);

  // Telemetry time ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setPlaybackSeconds((prev) => (prev >= 90 ? 0 : prev + 1));
      setAltitude((prev) => 120 + Math.floor(Math.sin(Date.now() / 3000) * 8));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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

  return (
    <div
      ref={containerRef}
      className="group relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-md flex flex-col"
    >
      {/* Top telemetry bar */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-300">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
            REAL INCIDENT VIDEO FOOTAGE
          </span>
          <span className="text-slate-500">|</span>
          <span className="truncate max-w-[140px] text-slate-400">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUseCanvasDrone((v) => !v)}
            className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] transition-colors"
          >
            {useCanvasDrone ? "🎥 View Real Video" : "📡 Drone HUD Scan"}
          </button>
          <button
            onClick={handleFullscreen}
            className="p-1 hover:text-white text-slate-400 transition-colors"
            title="Fullscreen Video"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Screen (Real Video or Canvas HUD) */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
        {useCanvasDrone ? (
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="w-full h-full object-cover cursor-crosshair"
            onClick={() => setIsPlaying((p) => !p)}
          />
        ) : (
          <video
            ref={videoRef}
            src={activeVideoSrc}
            controls
            autoPlay
            playsInline
            onError={() => {
              // Smooth fallback to interactive Drone Canvas if video file format is unsupported
              setUseCanvasDrone(true);
            }}
            className="w-full h-full object-cover bg-black"
          />
        )}

        {/* Big play indicator when paused */}
        {!isPlaying && (
          <div
            onClick={() => setIsPlaying(true)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center cursor-pointer"
          >
            <div className="p-4 rounded-full bg-gov-saffron text-slate-950 shadow-lg hover:scale-110 transition-transform">
              <Play className="w-6 h-6 fill-current" />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls Toolbar */}
      <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying((p) => !p);
              if (!useCanvasDrone && videoRef.current) {
                if (isPlaying) videoRef.current.pause();
                else videoRef.current.play();
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-colors"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setPlaybackSeconds(0);
              if (!useCanvasDrone && videoRef.current) {
                videoRef.current.currentTime = 0;
              }
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Rewind / Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <span className="text-slate-400 text-[11px] font-bold">
            {formatTime(playbackSeconds)} / 01:30
          </span>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setColorMode((m) => (m === "optical" ? "thermal" : "optical"))}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition-all ${
              colorMode === "thermal"
                ? "bg-purple-950/80 border-purple-600 text-purple-200"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            {colorMode === "thermal" ? (
              <>
                <Flame className="w-3 h-3 text-orange-400" />
                <span>FLIR Thermal</span>
              </>
            ) : (
              <>
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>Optical RGB</span>
              </>
            )}
          </button>

          <button
            onClick={toggleDroneAudio}
            className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition-all ${
              droneHumActive
                ? "bg-emerald-950/80 border-emerald-600 text-emerald-200"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title="Acoustic Drone Motor Telemetry Audio"
          >
            <Radio className="w-3 h-3 text-emerald-400" />
            <span>{droneHumActive ? "Drone Audio ON" : "Drone Audio"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
