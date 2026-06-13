import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: string;
  onEnded?: () => void;
}

export default function CountdownTimer({ endDate, onEnded }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOver: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endDate) - +new Date();
      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true };
      }
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isOver: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const current = calculateTimeLeft();
      setTimeLeft(current);
      if (current.isOver && onEnded) {
        onEnded();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate, onEnded]);

  if (!timeLeft) return null;

  if (timeLeft.isOver) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-650 bg-red-50 border border-red-100 px-3 py-1.5 rounded-md shadow-xs shrink-0 font-sans">
        <Clock size={14} className="text-red-600 animate-pulse" />
        <span>Voting Period Ended</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-amber-50 text-amber-955 border border-amber-200 px-3 py-1.5 rounded-lg shadow-xs shrink-0 select-none">
      <Clock size={14} className="text-amber-600 animate-spin-slow shrink-0" />
      <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-amber-700 mr-1 shrink-0">Time Left:</span>
      {timeLeft.days > 0 && (
        <span className="whitespace-nowrap">
          <span className="font-bold text-amber-900">{timeLeft.days}</span>
          <span className="text-[10px] text-amber-700/80 mr-1.5 font-sans ml-0.5">d</span>
        </span>
      )}
      <span className="font-bold text-amber-900">{String(timeLeft.hours).padStart(2, '0')}</span>
      <span className="text-[10px] text-amber-700/80 font-sans">:</span>
      <span className="font-bold text-amber-900">{String(timeLeft.minutes).padStart(2, '0')}</span>
      <span className="text-[10px] text-amber-700/80 font-sans">:</span>
      <span className="font-bold text-amber-600 animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
      <span className="text-[10px] text-amber-700/80 font-sans ml-0.5">s</span>
    </div>
  );
}
