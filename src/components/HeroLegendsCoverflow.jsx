import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { defaultHeroLegends } from '../data/heroLegends';

const mod = (value, total) => ((value % total) + total) % total;
const TICKER_DURATION = 5200;

export default function HeroLegendsCoverflow({ slides = defaultHeroLegends, label = 'Pakhtoon Legends', ariaLabel = 'Pakhtoon legends continuously moving coverflow' }) {
  const safeSlides = slides.length ? slides : defaultHeroLegends;
  const frameRef = useRef(null);
  const cardRefs = useRef([]);
  const positionRef = useRef(0);
  const targetRef = useRef(0);
  const widthRef = useRef(0);
  const tickerRef = useRef(null);
  const settleRef = useRef(null);
  const lastTickerTimeRef = useRef(null);
  const settlingRef = useRef(false);
  const dragRef = useRef(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const next = mod(selected, safeSlides.length);
    setSelected(next);
    positionRef.current = next;
    targetRef.current = next;
  }, [safeSlides.length]);

  const paint = useCallback(() => {
    const width = widthRef.current;
    if (!width) return;
    const pitch = width * 1.08;
    const position = positionRef.current;
    cardRefs.current.forEach((card, index) => {
      if (!card) return;
      let offset = index - position;
      offset = ((offset % safeSlides.length) + safeSlides.length) % safeSlides.length;
      if (offset > safeSlides.length / 2) offset -= safeSlides.length;
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, 0.62);
      const tilt = Math.min(42 * ramp, 80) * Math.sign(offset);
      const edge = Math.min(1, Math.max(0, safeSlides.length / 2 - distance));
      card.style.transform = `translateX(calc(-50% + ${offset * pitch}px)) translateZ(${-width * 0.52 * ramp}px) rotateY(${-tilt}deg)`;
      card.style.opacity = String(Math.max(0, 1 - distance * 0.12) * edge);
      card.style.zIndex = String(100 - Math.round(distance));
      card.classList.toggle('is-active', distance < 0.01);
    });
  }, [safeSlides.length]);

  const settle = useCallback((target) => {
    targetRef.current = target;
    settlingRef.current = true;
    setSelected(mod(Math.round(target), safeSlides.length));
    cancelAnimationFrame(settleRef.current);
    const animate = () => {
      const remaining = targetRef.current - positionRef.current;
      if (Math.abs(remaining) < 0.0005) {
        positionRef.current = targetRef.current;
        paint();
        settlingRef.current = false;
        settleRef.current = null;
        return;
      }
      positionRef.current += remaining * 0.16;
      paint();
      settleRef.current = requestAnimationFrame(animate);
    };
    settleRef.current = requestAnimationFrame(animate);
  }, [paint, safeSlides.length]);

  const moveBy = useCallback((amount) => settle(Math.round(positionRef.current) + amount), [settle]);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const measure = () => {
      widthRef.current = cardRefs.current[0]?.offsetWidth || 220;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => {
    const tick = (time) => {
      const previous = lastTickerTimeRef.current ?? time;
      const delta = Math.min(time - previous, 80);
      lastTickerTimeRef.current = time;
      if (!dragRef.current && !settlingRef.current) {
        positionRef.current += delta / TICKER_DURATION;
        targetRef.current = positionRef.current;
        setSelected(mod(Math.round(positionRef.current), safeSlides.length));
        paint();
      }
      tickerRef.current = requestAnimationFrame(tick);
    };
    tickerRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(tickerRef.current);
      cancelAnimationFrame(settleRef.current);
      tickerRef.current = null;
      settleRef.current = null;
    };
  }, [paint, safeSlides.length]);

  const onPointerDown = (event) => {
    cancelAnimationFrame(settleRef.current);
    settlingRef.current = false;
    frameRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = { id: event.pointerId, x: event.clientX, position: positionRef.current, lastTime: performance.now(), velocity: 0 };
  };

  const onPointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId || !widthRef.current) return;
    const now = performance.now();
    const previous = positionRef.current;
    positionRef.current = drag.position - (event.clientX - drag.x) / (widthRef.current * 1.08);
    drag.velocity = (positionRef.current - previous) / Math.max(now - drag.lastTime, 1) * 1000;
    drag.lastTime = now;
    setSelected(mod(Math.round(positionRef.current), safeSlides.length));
    paint();
  };

  const onPointerUp = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== event.pointerId) return;
    dragRef.current = null;
    const carried = Math.max(-2, Math.min(2, drag.velocity * 0.18));
    settle(Math.round(positionRef.current + carried));
  };

  const active = safeSlides[selected] || safeSlides[0];

  return (
    <div className="opc-legends-coverflow" aria-label="Pakhtoon legends gallery">
      <div className="opc-honourees-label">✦ {label}</div>
      <div
        ref={frameRef}
        className="opc-legends-coverflow-frame"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); moveBy(-1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); moveBy(1); }
        }}
      >
        <div className="opc-legends-coverflow-track">
          {safeSlides.map((legend, index) => (
            <article className="opc-legends-coverflow-card" key={legend.id || `${legend.name}-${index}`} ref={(node) => { cardRefs.current[index] = node; }}>
              {legend.image ? <img src={legend.image} alt={legend.name} loading={index < 3 ? 'eager' : 'lazy'} draggable="false" /> : <div className="opc-legends-coverflow-card-placeholder" aria-hidden="true">{legend.initials || '?'}</div>}
              <div className="opc-legends-coverflow-card-index">OPC / {String(index + 1).padStart(2, '0')}</div>
              <div className="opc-legends-coverflow-card-shade" />
            </article>
          ))}
        </div>
        <button type="button" className="opc-legends-coverflow-nav opc-legends-coverflow-prev" onClick={() => moveBy(-1)} aria-label="Previous Pakhtoon legend"><ChevronLeft size={20} /></button>
        <button type="button" className="opc-legends-coverflow-nav opc-legends-coverflow-next" onClick={() => moveBy(1)} aria-label="Next Pakhtoon legend"><ChevronRight size={20} /></button>
      </div>
      <div className="opc-legends-coverflow-caption" aria-live="polite">
        <div className="opc-legends-coverflow-category">{active.category}</div>
        <h2>{active.name}</h2>
        <p className="opc-legends-coverflow-honor">{active.honor}</p>
        <p className="opc-legends-coverflow-legacy">{active.legacy}</p>
      </div>
      <div className="opc-legends-coverflow-dots" aria-label="Choose a legend">
        {safeSlides.map((legend, index) => <button type="button" key={legend.id || `${legend.name}-dot`} className={index === selected ? 'is-active' : ''} aria-label={`Show ${legend.name}`} aria-current={index === selected ? 'true' : undefined} onClick={() => settle(index)} />)}
      </div>
    </div>
  );
}
