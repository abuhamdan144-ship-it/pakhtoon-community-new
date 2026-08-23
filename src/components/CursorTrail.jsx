import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CursorTrail() {
  const [trail, setTrail] = useState([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const newParticle = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
      };
      setTrail((prev) => [...prev, newParticle].slice(-15)); // Keep last 15
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {trail.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_rgba(212,175,55,0.8)]"
          initial={{ x: p.x, y: p.y, opacity: 1, scale: 1 }}
          animate={{ opacity: 0, scale: 0, y: p.y + 20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          onAnimationComplete={() => setTrail((t) => t.filter((i) => i.id !== p.id))}
        />
      ))}
    </div>
  );
}
