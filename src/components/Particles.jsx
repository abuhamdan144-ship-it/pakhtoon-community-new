import React from 'react';
import { motion } from 'framer-motion';

export default function Particles({ count = 30 }) {
  const particles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
    size: Math.random() * 3 + 1,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute bottom-[-10px] bg-gold rounded-full opacity-60"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 10px rgba(212, 175, 55, 0.8)",
          }}
          animate={{
            y: [0, -window.innerHeight - 100],
            x: [0, Math.random() * 50 - 25],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
