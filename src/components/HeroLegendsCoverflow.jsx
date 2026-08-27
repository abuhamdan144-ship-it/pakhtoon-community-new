import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { defaultHeroLegends } from '../data/heroLegends';

const mod = (value, total) => ((value % total) + total) % total;
const TICKER_STEP_MS = 4200;

export default function HeroLegendsCoverflow({ slides = defaultHeroLegends }) {
  const safeSlides = useMemo(() => (slides.length ? slides : defaultHeroLegends), [slides]);
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setSelected((current) => mod(current, safeSlides.length));
  }, [safeSlides.length]);

  useEffect(() => {
    if (paused || safeSlides.length < 2) return undefined;
    const interval = window.setInterval(() => {
      setSelected((current) => mod(current + 1, safeSlides.length));
    }, TICKER_STEP_MS);
    return () => window.clearInterval(interval);
  }, [paused, safeSlides.length]);

  const active = safeSlides[selected] || safeSlides[0];
  const groups = [safeSlides, safeSlides];

  const moveBy = (amount) => {
    setSelected((current) => mod(current + amount, safeSlides.length));
  };

  return (
    <div className="opc-legends-coverflow" aria-label="Pakhtoon legends gallery">
      <div className="opc-honourees-label">✦ Pakhtoon Legends</div>
      <div
        className="opc-legends-coverflow-frame"
        role="region"
        aria-roledescription="carousel"
        aria-label="Pakhtoon legends moving ticker"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
      >
        <div className="opc-legends-coverflow-mask">
          <div
            className={`opc-legends-coverflow-track${paused ? ' is-paused' : ''}`}
            style={{ '--ticker-duration': `${Math.max(26, safeSlides.length * 4)}s` }}
          >
            {groups.map((group, groupIndex) => (
              <div className="opc-legends-coverflow-group" key={`legend-group-${groupIndex}`} aria-hidden={groupIndex === 1}>
                {group.map((legend, index) => (
                  <article
                    className={`opc-legends-coverflow-card${index === selected ? ' is-active' : ''}`}
                    key={`${legend.id || legend.name || 'legend'}-${groupIndex}-${index}`}
                  >
                    <img src={legend.image} alt={groupIndex === 1 ? '' : legend.name} loading={index < 3 ? 'eager' : 'lazy'} draggable="false" />
                    <div className="opc-legends-coverflow-card-index">OPC / {String(index + 1).padStart(2, '0')}</div>
                    <div className="opc-legends-coverflow-card-shade" />
                  </article>
                ))}
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="opc-legends-coverflow-nav opc-legends-coverflow-prev" onClick={() => moveBy(-1)} aria-label="Previous Pakhtoon legend"><ChevronLeft size={20} /></button>
        <button type="button" className="opc-legends-coverflow-nav opc-legends-coverflow-next" onClick={() => moveBy(1)} aria-label="Next Pakhtoon legend"><ChevronRight size={20} /></button>
        <button type="button" className="opc-legends-coverflow-pause" onClick={() => setPaused((current) => !current)} aria-label={paused ? 'Resume Pakhtoon legends ticker' : 'Pause Pakhtoon legends ticker'}>
          {paused ? <Play size={14} /> : <Pause size={14} />}
          <span>{paused ? 'Play' : 'Pause'}</span>
        </button>
      </div>
      <div className="opc-legends-coverflow-caption" aria-live="polite">
        <div className="opc-legends-coverflow-category">{active.category}</div>
        <h2>{active.name}</h2>
        <p className="opc-legends-coverflow-honor">{active.honor}</p>
        <p className="opc-legends-coverflow-legacy">{active.legacy}</p>
      </div>
      <div className="opc-legends-coverflow-dots" aria-label="Choose a legend">
        {safeSlides.map((legend, index) => (
          <button type="button" key={legend.id || `${legend.name}-dot`} className={index === selected ? 'is-active' : ''} aria-label={`Show ${legend.name}`} aria-current={index === selected ? 'true' : undefined} onClick={() => setSelected(index)} />
        ))}
      </div>
    </div>
  );
}
