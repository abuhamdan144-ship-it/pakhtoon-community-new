import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ClipboardCheck } from 'lucide-react';

interface FormSubmitButtonProps {
  isLoading: boolean;
  isSuccess: boolean;
  label: React.ReactNode;
  successLabel?: string;
  disabled?: boolean;
  type?: 'submit' | 'button';
  className?: string;
  successClassName?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  distance: number;
}

const PARTICLE_COLORS = ['#34d399', '#f59e0b', '#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#60a5fa'];

export default function FormSubmitButton({
  isLoading,
  isSuccess,
  label,
  successLabel = 'Submitted Successfully!',
  disabled,
  type = 'submit',
  className = '',
  successClassName = 'bg-emerald-600 hover:bg-emerald-700 text-white',
}: FormSubmitButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (isSuccess) {
      // Trigger a batch of particles
      const newParticles: Particle[] = Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360 + Math.random() * 15;
        const distance = 40 + Math.random() * 60;
        const x = Math.cos((angle * Math.PI) / 180) * distance;
        const y = Math.sin((angle * Math.PI) / 180) * distance;
        const size = 4 + Math.random() * 6;
        const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
        return {
          id: Date.now() + i,
          x,
          y,
          color,
          size,
          angle,
          distance,
        };
      });
      setParticles(newParticles);

      // Clean up after animation is done
      const timer = setTimeout(() => {
        setParticles([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  return (
    <div className="relative w-full flex justify-center items-center">
      {/* Particles effect */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0.5, 1.2, 0],
              x: p.x,
              y: p.y,
              rotate: p.angle * 2,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              backgroundColor: p.color,
              pointerEvents: 'none',
              zIndex: 50,
            }}
          />
        ))}
      </AnimatePresence>

      <motion.button
        type={type}
        disabled={disabled || isLoading}
        animate={isSuccess ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 0.3 }}
        className={`relative overflow-hidden ${
          isSuccess ? successClassName : className
        }`}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 justify-center"
            >
              <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing...</span>
            </motion.span>
          ) : isSuccess ? (
            <motion.span
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 justify-center font-bold"
            >
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.div>
              <span>{successLabel}</span>
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 justify-center w-full"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
