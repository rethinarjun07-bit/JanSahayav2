"use client";

import React, { useEffect, useState, useCallback } from "react";
import { sound } from "@/lib/sound";

interface ClickRipple {
  id: number;
  x: number;
  y: number;
}

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
}

const PARTICLE_COLORS = [
  "#F57C00", // Saffron
  "#FF9933", // Warm Gold
  "#2563EB", // Deep Blue
  "#10B981", // Emerald
  "#EC4899", // Pink Sparkle
  "#FBBF24", // Amber
];

export function ClickEffectProvider() {
  const [ripples, setRipples] = useState<ClickRipple[]>([]);
  const [particles, setParticles] = useState<ClickParticle[]>([]);

  const handlePointerDown = useCallback((e: MouseEvent) => {
    // Only trigger for primary clicks (left click)
    if (e.button !== 0) return;

    const x = e.clientX;
    const y = e.clientY;
    const now = Date.now() + Math.random();

    // Check if clicked element or its parent is an interactive element
    const target = e.target as HTMLElement | null;
    const isInteractive = target?.closest(
      'button, a, input, select, textarea, [role="button"], .interactive-pop, .cursor-pointer'
    );

    // Only fire effects on interactive targets — keeps the civic portal clean & professional
    if (!isInteractive) return;

    // Soft tactile audio feedback
    try {
      sound.playClick();
    } catch {
      // AudioContext error safeguard
    }

    // Add a subtle ripple on interactive click
    setRipples((prev) => [...prev.slice(-4), { id: now, x, y }]);

    // Spawn 4 minimal popping particles (reduced from 6, less visual noise)
    const newParticles: ClickParticle[] = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      const angle = (i * (360 / count) + Math.random() * 15 - 7.5) * (Math.PI / 180);
      const distance = 18 + Math.random() * 16;
      newParticles.push({
        id: now + i + 1,
        x,
        y,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 2.5 + Math.random() * 2,
      });
    }

    setParticles((prev) => [...prev.slice(-12), ...newParticles]);

    // Clean up ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== now));
    }, 500);

    // Clean up particles
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 450);
  }, []);

  useEffect(() => {
    window.addEventListener("mousedown", handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [handlePointerDown]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none z-[999999]"
    >
      {/* Expanding Ripple Rings */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="click-pop-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
        />
      ))}

      {/* Floating Sparkle Particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="click-pop-particle"
          style={
            {
              left: p.x,
              top: p.y,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
