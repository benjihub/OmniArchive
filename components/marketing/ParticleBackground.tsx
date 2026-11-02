"use client";

import Script from "next/script";
import { useRef } from "react";

type ParticleEngine = {
  load: (config: { id: string; options: Record<string, unknown> }) => Promise<unknown>;
};

declare global {
  interface Window {
    tsParticles?: ParticleEngine;
  }
}

const particleOptions: Record<string, unknown> = {
  background: { color: { value: "#090D16" } },
  particles: {
    number: { value: 60, density: { enable: true } },
    color: { value: ["#6366F1", "#8B5CF6", "#94A3B8"] },
    links: { enable: true, color: "#1E293B", distance: 150, opacity: 0.4 },
    move: { enable: true, speed: 1 },
    size: { value: { min: 1, max: 3 } },
  },
};

export function ParticleBackground() {
  const initialized = useRef(false);

  function initializeParticles() {
    if (!window.tsParticles || initialized.current) return;

    initialized.current = true;
    void window.tsParticles.load({ id: "tsparticles", options: particleOptions });
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/@tsparticles/bundle@3.3.0/tsparticles.bundle.min.js"
        strategy="afterInteractive"
        onLoad={initializeParticles}
      />
      <div
        id="tsparticles"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-80"
      />
    </>
  );
}
