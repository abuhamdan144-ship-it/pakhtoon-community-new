import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import jahngirJansherImage from '../assets/images/legends/jahangir-jansher-khan.jpg';
import younisImage from '../assets/images/legends/younis-khan.jpg';
import shahidImage from '../assets/images/legends/shahid-afridi.jpg';
import hamzaImage from '../assets/images/legends/hamza-baba.webp';
import ghaniImage from '../assets/images/legends/ghani-khan.png';
import bakhtiarImage from '../assets/images/legends/bakhtiar-khattak.jpg';
import khushalImage from '../assets/images/legends/khushal-khan-khattak.png';
import rahmanImage from '../assets/images/legends/rahman-baba.jpg';
import { collections } from '../firebase/collections';
import { onSnapshot, query } from 'firebase/firestore';

export default function HTMLDesignPreview() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('OMR 10');
  const [daysRemaining, setDaysRemaining] = useState(41);
  const [cardTransform, setCardTransform] = useState('rotate(-3deg)');
  const [cabinetMembers, setCabinetMembers] = useState([]);
  const [cabinetLoaded, setCabinetLoaded] = useState(false);

  const opcCardRef = useRef(null);
  const progressFillRef = useRef(null);
  const legends = [
    {
      category: 'Legends of Sports',
      name: 'Jahangir Khan & Jansher Khan',
      image: jahngirJansherImage,
      visualCredit: 'Historic squash image',
      honor: 'Squash Champions · World Record Holders',
      summary: 'Two Pakhtoon squash champions whose era of dominance made Pakistan a global powerhouse in the sport.',
      legacy: 'Jahangir’s 555-match winning streak and Jansher’s record eight World Open titles remain defining milestones in squash history.',
    },
    {
      category: 'Legends of Sports',
      name: 'Younis Khan',
      image: younisImage,
      visualCredit: 'Cricket portrait',
      honor: 'Pakistan Captain · Test Cricket Great',
      summary: 'The former Pakistan captain and world-class batsman from Mardan who led with grit and composure.',
      legacy: 'Pakistan’s first Test batter to pass 10,000 runs, he also captained the side to the 2009 ICC World Twenty20 title.',
    },
    {
      category: 'Legends of Sports',
      name: 'Shahid Afridi',
      image: shahidImage,
      visualCredit: 'Cricket photograph',
      honor: '“Boom Boom” · Pakistan All-Rounder',
      summary: '“Boom Boom” Afridi is an iconic Pakhtoon all-rounder celebrated for his fearless batting and quick leg-spin.',
      legacy: 'His charisma and aggressive limited-overs style made him one of Pakistan cricket’s most recognisable global figures.',
    },
    {
      category: 'Cultural & Literary Icons',
      name: 'Hamza Baba',
      image: hamzaImage,
      visualCredit: 'Literary feature image',
      honor: 'Baba-e-Ghazal · Pashto Poet',
      summary: 'Amir Hamza Shinwari, revered as Baba-e-Ghazal, expanded the expressive range of modern Pashto poetry.',
      legacy: 'His work fused Sufi thought with romantic expression and helped bridge classical and modern Pashto literature.',
    },
    {
      category: 'Cultural & Literary Icons',
      name: 'Ghani Khan',
      image: ghaniImage,
      visualCredit: 'Archival art visual',
      honor: 'Poet · Artist · Philosopher',
      summary: 'A poet, artist, and thinker whose distinctive voice shaped twentieth-century Pashto literature.',
      legacy: 'His poetry brought philosophical reflection, wit, and artistic independence to a new generation of readers.',
    },
    {
      category: 'Cultural & Literary Icons',
      name: 'Bakhtiar Khattak',
      image: bakhtiarImage,
      visualCredit: 'Artist portrait',
      honor: 'Pashto Singer · Tamgha-i-Imtiaz',
      summary: 'A Pashto singer and host whose work has carried Pakhtoon culture to contemporary audiences.',
      legacy: 'He received the Tamgha-i-Imtiaz in 2025 in recognition of his cultural contribution.',
    },
    {
      category: 'Revolutionary Resistance Leaders',
      name: 'Khushal Khan Khattak',
      image: khushalImage,
      visualCredit: 'Historic illustration',
      honor: 'Warrior Poet · Voice of Pashtuns',
      summary: 'A seventeenth-century warrior, tribal chief, and defining poet of the Pashtuns.',
      legacy: 'His poetry called for unity, leadership, dignity, and resistance in defence of Pakhtoon autonomy.',
    },
    {
      category: 'Revolutionary Resistance Leaders',
      name: 'Rahman Baba',
      image: rahmanImage,
      visualCredit: 'Historic portrait and shrine visual',
      honor: 'Sufi Poet · Prince of Pashto Poets',
      summary: 'An iconic seventeenth-century Sufi poet whose spiritual verse remains central to Pashto culture.',
      legacy: 'His poetry of divine love, introspection, and humanism continues to resonate across generations.',
    },
  ];
  const heroLegendsLoop = [...legends, ...legends];

  // Scroll listener for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load only the public-safe cabinet profile fields. Phone numbers and email addresses are never rendered on this page.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collections.cabinet),
      (snapshot) => {
        const profiles = snapshot.docs
          .map((cabinetDoc) => {
            const data = cabinetDoc.data();
            return {
              id: cabinetDoc.id,
              name: typeof data.name === 'string' ? data.name : '',
              position: typeof data.position === 'string' ? data.position : 'OPC Cabinet Member',
              photo: typeof data.photo === 'string' ? data.photo : '',
            };
          })
          .filter((profile) => profile.name);

        setCabinetMembers(profiles);
        setCabinetLoaded(true);
      },
      () => {
        setCabinetMembers([]);
        setCabinetLoaded(true);
      },
    );

    return () => unsubscribe();
  }, []);

  // Calculate election countdown
  useEffect(() => {
    const electionDate = new Date('2026-09-15T00:00:00');
    const now = new Date();
    const diff = Math.ceil((electionDate - now) / (1000 * 60 * 60 * 24));
    setDaysRemaining(Math.max(0, diff));
  }, []);

  // Toast trigger
  const triggerToast = (msg = 'Our team will reach out via WhatsApp shortly.') => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  // 3D Card Tilt handler
  const handleCardMouseMove = (e) => {
    if (!opcCardRef.current) return;
    const rect = opcCardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setCardTransform(`perspective(800px) rotateY(${dx * 10}deg) rotateX(${-dy * 8}deg) scale(1.03)`);
  };

  const handleCardMouseLeave = () => {
    setCardTransform('rotate(-3deg)');
  };

  // Scroll smoothly to section
  const scrollTo = (id) => {
    setMobileNavOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="opc-design-root">
      <style>{`
        .opc-design-root {
          --g-900: #0a2a1f;
          --g-800: #0f3d30;
          --g-700: #1b4d3e;
          --g-600: #2d6654;
          --g-400: #4a8c76;
          --g-200: #9dcfbf;
          --g-100: #e8f5f1;
          --gold:  #d4af37;
          --gold-l:#f0d060;
          --gold-d:#a88a1a;
          --cream: #f8f3e8;
          --white: #ffffff;
          --black: #0a0a0a;

          --radius-sm: 10px;
          --radius-md: 18px;
          --radius-lg: 28px;
          --ease: cubic-bezier(.22,.68,0,1.2);
          --ease-smooth: cubic-bezier(.25,.1,.25,1);
          --maxw: 1180px;

          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
          background: var(--g-900);
          color: var(--cream);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
          width: 100%;
          min-height: 100vh;
        }

        .opc-wrap {
          max-width: var(--maxw);
          margin: 0 auto;
          padding: 0 28px;
        }

        /* HEADER */
        .opc-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          transition: background .4s, backdrop-filter .4s, border-bottom .4s;
        }
        .opc-header.scrolled {
          background: rgba(10,42,31,.88);
          backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(212,175,55,.15);
        }
        .opc-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 68px;
          max-width: var(--maxw);
          margin: 0 auto;
          padding: 0 28px;
        }
        .opc-nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .opc-emblem {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-d));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: var(--g-900);
          box-shadow: 0 0 20px rgba(212,175,55,.4);
          flex-shrink: 0;
        }
        .opc-brand-text .name {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -.3px;
          color: var(--white);
          line-height: 1;
        }
        .opc-brand-text .sub {
          font-size: 10px;
          color: var(--gold);
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .opc-nav-links {
          display: flex;
          gap: 30px;
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,.75);
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .opc-nav-links a:hover {
          color: var(--gold);
        }
        .opc-nav-actions {
          display: flex;
          gap: 10px;
        }
        .opc-btn {
          padding: 10px 22px;
          border-radius: 980px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: .2px;
          transition: transform .2s var(--ease), box-shadow .2s;
          display: inline-block;
          text-decoration: none;
          cursor: pointer;
          border: none;
          font-family: inherit;
        }
        .opc-btn:hover {
          transform: translateY(-2px);
        }
        .opc-btn-ghost {
          border: 1px solid rgba(212,175,55,.5);
          color: var(--gold);
          background: transparent;
        }
        .opc-btn-ghost:hover {
          background: rgba(212,175,55,.08);
          box-shadow: 0 0 20px rgba(212,175,55,.15);
        }
        .opc-btn-gold {
          background: var(--gold);
          color: var(--g-900);
        }
        .opc-btn-gold:hover {
          background: var(--gold-l);
          box-shadow: 0 8px 24px rgba(212,175,55,.4);
        }
        .opc-btn-green {
          background: var(--g-700);
          color: var(--white);
        }
        .opc-btn-green:hover {
          background: var(--g-600);
          box-shadow: 0 8px 24px rgba(27,77,62,.5);
        }
        .opc-mobile-menu-btn {
          display: none;
          font-size: 24px;
          color: var(--white);
          background: none;
          border: none;
          cursor: pointer;
        }

        /* HERO */
        .opc-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding-top: 68px;
        }
        .opc-hero-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(160deg, var(--g-900) 0%, var(--g-800) 55%, #0d3326 100%);
        }
        .opc-mountain-svg {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          opacity: .18;
          pointer-events: none;
        }
        .opc-hero-glow {
          position: absolute;
          top: 30%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(212,175,55,.12) 0%, transparent 65%);
          pointer-events: none;
        }
        .opc-hero-stars {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(1px 1px at 20% 15%, rgba(255,255,255,.6) 0%, transparent 100%),
            radial-gradient(1px 1px at 70% 8%,  rgba(255,255,255,.4) 0%, transparent 100%),
            radial-gradient(1px 1px at 45% 25%, rgba(255,255,255,.5) 0%, transparent 100%),
            radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,.3) 0%, transparent 100%),
            radial-gradient(1px 1px at 10% 40%, rgba(255,255,255,.3) 0%, transparent 100%);
        }
        .opc-hero-content {
          position: relative;
          z-index: 2;
          width: min(1180px, 100%);
          display: grid;
          grid-template-columns: minmax(360px, 1.08fr) minmax(320px, .92fr);
          gap: clamp(34px, 6vw, 86px);
          align-items: center;
          padding: 36px 28px;
        }
        .opc-hero-copy { text-align: left; }
        .opc-hero-copy .opc-hero-sub { margin-left: 0; }
        .opc-hero-copy .opc-hero-ctas, .opc-hero-copy .opc-hero-stats { justify-content: flex-start; }
        .opc-honourees {
          position: relative;
          overflow: hidden;
          padding: 18px 0 18px 18px;
          border: 1px solid rgba(212,175,55,.28);
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,.08), rgba(5,31,22,.3));
          box-shadow: 0 22px 70px rgba(0,0,0,.28);
        }
        .opc-honourees::before, .opc-honourees::after {
          content: '';
          position: absolute;
          z-index: 2;
          top: 0;
          bottom: 0;
          width: 56px;
          pointer-events: none;
        }
        .opc-honourees::before { left: 0; background: linear-gradient(90deg, #0a2a1f, transparent); }
        .opc-honourees::after { right: 0; background: linear-gradient(270deg, #0a2a1f, transparent); }
        .opc-honourees-label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 14px 4px;
          color: var(--gold);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .opc-honourees-track {
          display: flex;
          gap: 14px;
          width: max-content;
          animation: opc-slide-left 52s linear infinite;
        }
        .opc-honourees:hover .opc-honourees-track { animation-play-state: paused; }
        .opc-honouree-card {
          position: relative;
          width: 200px;
          height: 276px;
          flex: 0 0 auto;
          overflow: hidden;
          border: 1px solid rgba(212,175,55,.4);
          border-radius: 14px;
          background: var(--g-900);
        }
        .opc-honouree-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .5s ease;
        }
        .opc-honouree-card:hover img { transform: scale(1.06); }
        .opc-honouree-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(4,20,15,.96) 0%, rgba(4,20,15,.28) 52%, transparent 78%);
        }
        .opc-honouree-caption {
          position: absolute;
          z-index: 1;
          left: 15px;
          right: 15px;
          bottom: 14px;
        }
        .opc-honouree-name { color: var(--white); font-size: 17px; font-weight: 800; line-height: 1.14; }
        .opc-honouree-honor { color: var(--gold); margin-top: 6px; font-size: 10px; font-weight: 700; letter-spacing: .8px; line-height: 1.35; text-transform: uppercase; }
        @keyframes opc-slide-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .opc-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: rgba(212,175,55,.1);
          border: 1px solid rgba(212,175,55,.25);
          border-radius: 980px;
          padding: 8px 18px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 28px;
        }
        .opc-hero-eyebrow span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
        }
        .opc-hero h1 {
          font-size: clamp(38px, 7vw, 82px);
          font-weight: 900;
          letter-spacing: -2px;
          line-height: .96;
          color: var(--white);
          margin-bottom: 10px;
        }
        .opc-hero h1 em {
          font-style: normal;
          color: var(--gold);
          display: block;
        }
        .opc-hero-sub {
          font-size: clamp(14px, 2vw, 18px);
          color: rgba(255,255,255,.6);
          margin: 20px auto 36px;
          max-width: 520px;
          line-height: 1.6;
        }
        .opc-hero-ctas {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 60px;
        }
        .opc-hero-stats {
          display: flex;
          gap: 48px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .opc-hero-stat .num {
          font-size: 32px;
          font-weight: 900;
          color: var(--gold);
          letter-spacing: -1px;
        }
        .opc-hero-stat .lbl {
          font-size: 11px;
          color: rgba(255,255,255,.5);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 4px;
        }
        .opc-scroll-indicator {
          position: absolute;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,.35);
          animation: opc-bob 2s ease-in-out infinite;
        }
        .opc-scroll-indicator .arrow {
          width: 1px;
          height: 40px;
          background: linear-gradient(to bottom, rgba(212,175,55,.6), transparent);
        }
        @keyframes opc-bob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }

        /* MEMBERSHIP CARD SECTION */
        .opc-card-section {
          padding: 100px 0;
          background: var(--g-800);
          position: relative;
          overflow: hidden;
        }
        .opc-card-section::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
        }
        .opc-card-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }
        .opc-card-copy h2 {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 900;
          letter-spacing: -1px;
          margin-bottom: 16px;
          color: var(--white);
        }
        .opc-card-copy h2 span {
          color: var(--gold);
        }
        .opc-card-copy p {
          color: rgba(255,255,255,.65);
          font-size: 15px;
          line-height: 1.7;
          margin-bottom: 28px;
        }
        .opc-card-features {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 34px;
        }
        .opc-card-feature {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          font-size: 14px;
        }
        .opc-card-feature .icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(212,175,55,.15);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        /* The actual membership card visual */
        .opc-card-item {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          aspect-ratio: 1.586;
          border-radius: 22px;
          background: linear-gradient(135deg, var(--g-700) 0%, var(--g-900) 60%, #082015 100%);
          border: 1px solid rgba(212,175,55,.3);
          box-shadow:
            0 40px 80px rgba(0,0,0,.6),
            0 0 0 1px rgba(212,175,55,.1),
            inset 0 1px 0 rgba(255,255,255,.05);
          padding: 26px 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: transform .4s var(--ease);
          cursor: pointer;
        }
        .opc-card-item::before {
          content: "";
          position: absolute;
          right: -20px;
          bottom: -20px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(212,175,55,.08), transparent 70%);
          border-radius: 50%;
        }
        .opc-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
          z-index: 2;
        }
        .opc-card-emblem {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-d));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 900;
          color: var(--g-900);
        }
        .opc-card-org {
          text-align: right;
        }
        .opc-card-org .org-name {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: var(--gold);
        }
        .opc-card-org .org-sub {
          font-size: 9px;
          color: rgba(255,255,255,.5);
          letter-spacing: 1px;
        }
        .opc-card-mid {
          position: relative;
          z-index: 2;
        }
        .opc-card-mid .member-name {
          font-size: 20px;
          font-weight: 800;
          color: var(--white);
          letter-spacing: -.3px;
        }
        .opc-card-mid .member-title {
          font-size: 11px;
          color: var(--gold);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 2px;
        }
        .opc-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 2;
        }
        .opc-member-id {
          font-family: monospace;
          font-size: 12px;
          color: rgba(255,255,255,.6);
          letter-spacing: 1px;
        }
        .opc-card-valid {
          font-size: 10px;
          color: rgba(255,255,255,.45);
          text-align: right;
        }
        .opc-card-valid span {
          display: block;
          color: rgba(255,255,255,.7);
          font-size: 11px;
          font-weight: 600;
        }
        .opc-card-item::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--gold), var(--gold-l), var(--gold), transparent);
        }

        /* PILLARS */
        .opc-pillars-section {
          padding: 100px 0;
          background: var(--g-900);
        }
        .opc-section-label {
          font-size: 11px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .opc-section-label::before {
          content: "";
          width: 28px;
          height: 1px;
          background: var(--gold);
        }
        .opc-section-head h2 {
          font-size: clamp(28px, 4vw, 46px);
          font-weight: 900;
          letter-spacing: -1px;
          margin-bottom: 14px;
          color: var(--white);
        }
        .opc-section-head p {
          color: rgba(255,255,255,.6);
          font-size: 15px;
          line-height: 1.7;
          max-width: 540px;
        }
        .opc-pillars-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 56px;
        }
        .opc-pillar-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: var(--radius-md);
          padding: 32px 28px;
          transition: border-color .3s, background .3s, transform .3s var(--ease);
          position: relative;
          overflow: hidden;
        }
        .opc-pillar-card:hover {
          border-color: rgba(212,175,55,.35);
          background: rgba(212,175,55,.04);
          transform: translateY(-4px);
        }
        .opc-pillar-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--gold), transparent);
          opacity: 0;
          transition: opacity .3s;
        }
        .opc-pillar-card:hover::before {
          opacity: 1;
        }
        .opc-pillar-icon {
          font-size: 28px;
          margin-bottom: 20px;
        }
        .opc-pillar-card h3 {
          font-size: 18px;
          font-weight: 800;
          margin-bottom: 10px;
          letter-spacing: -.3px;
          color: var(--white);
        }
        .opc-pillar-card p {
          font-size: 13px;
          color: rgba(255,255,255,.55);
          line-height: 1.7;
        }

        /* CABINET */
        .opc-cabinet-section {
          padding: 100px 0;
          background: linear-gradient(180deg, var(--g-900) 0%, var(--g-800) 100%);
        }
        .opc-cabinet-president {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
          margin-bottom: 64px;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(212,175,55,.2);
          border-radius: var(--radius-lg);
          padding: 40px;
        }
        .opc-president-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--g-600), var(--g-400));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 44px;
          border: 3px solid var(--gold);
          box-shadow: 0 0 40px rgba(212,175,55,.25);
          margin-bottom: 16px;
        }
        .opc-president-info .role {
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 8px;
        }
        .opc-president-info .name {
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -.5px;
          margin-bottom: 10px;
          color: var(--white);
        }
        .opc-president-info p {
          font-size: 13px;
          color: rgba(255,255,255,.6);
          line-height: 1.7;
        }
        .opc-president-stats {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .opc-pres-stat {
          background: rgba(212,175,55,.08);
          border: 1px solid rgba(212,175,55,.15);
          border-radius: 12px;
          padding: 20px;
          text-align: center;
        }
        .opc-pres-stat .num {
          font-size: 28px;
          font-weight: 900;
          color: var(--gold);
        }
        .opc-pres-stat .lbl {
          font-size: 11px;
          color: rgba(255,255,255,.5);
          margin-top: 4px;
        }
        .opc-cabinet-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        .opc-cabinet-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: var(--radius-md);
          padding: 24px 20px;
          text-align: center;
          transition: border-color .3s, background .3s, transform .3s var(--ease);
        }
        .opc-cabinet-card:hover {
          border-color: rgba(212,175,55,.3);
          background: rgba(212,175,55,.04);
          transform: translateY(-4px);
        }
        .opc-cabinet-avatar {
          width: 76px;
          height: 76px;
          overflow: hidden;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--g-700), var(--g-600));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          margin: 0 auto 14px;
          border: 2px solid rgba(212,175,55,.45);
          color: var(--gold);
          font-weight: 800;
        }
        .opc-cabinet-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .opc-cabinet-card .role {
          font-size: 10px;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 6px;
        }
        .opc-cabinet-card .name {
          font-size: 14px;
          font-weight: 700;
          color: var(--white);
        }
        .opc-cabinet-card .origin {
          font-size: 12px;
          color: rgba(255,255,255,.45);
          margin-top: 4px;
        }

        /* NEWS */
        .opc-news-section {
          padding: 100px 0;
          background: var(--g-900);
        }
        .opc-news-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-top: 48px;
        }
        .opc-news-featured {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: border-color .3s;
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .opc-news-featured:hover {
          border-color: rgba(212,175,55,.3);
        }
        .opc-news-img {
          height: 240px;
          background: linear-gradient(135deg, var(--g-700), var(--g-600));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
        }
        .opc-news-body {
          padding: 28px;
        }
        .opc-news-tag {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 10px;
        }
        .opc-news-body h3 {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -.3px;
          margin-bottom: 10px;
          line-height: 1.3;
          color: var(--white);
        }
        .opc-news-body p {
          font-size: 13px;
          color: rgba(255,255,255,.55);
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .opc-news-meta {
          font-size: 12px;
          color: rgba(255,255,255,.35);
        }
        .opc-news-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .opc-news-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: var(--radius-sm);
          padding: 16px;
          transition: border-color .3s;
          text-decoration: none;
          color: inherit;
        }
        .opc-news-item:hover {
          border-color: rgba(212,175,55,.25);
        }
        .opc-news-item-img {
          width: 60px;
          height: 60px;
          border-radius: 10px;
          flex-shrink: 0;
          background: var(--g-700);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }
        .opc-news-item h4 {
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 4px;
          color: var(--white);
        }
        .opc-news-item p {
          font-size: 11px;
          color: rgba(255,255,255,.4);
        }

        /* ELECTIONS */
        .opc-elections-section {
          padding: 100px 0;
          background: var(--g-800);
          position: relative;
          overflow: hidden;
        }
        .opc-elections-section::before {
          content: "";
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent, transparent 40px,
            rgba(212,175,55,.02) 40px, rgba(212,175,55,.02) 41px
          );
        }
        .opc-elections-inner {
          position: relative;
          z-index: 1;
        }
        .opc-election-card {
          background: rgba(10,42,31,.8);
          border: 1px solid rgba(212,175,55,.25);
          border-radius: var(--radius-lg);
          padding: 40px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 32px;
          align-items: center;
          margin-bottom: 20px;
        }
        .opc-election-card h3 {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -.4px;
          margin-bottom: 8px;
          color: var(--white);
        }
        .opc-election-card p {
          color: rgba(255,255,255,.6);
          font-size: 14px;
          margin-bottom: 20px;
        }
        .opc-candidate-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .opc-candidate-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,.05);
          border: 1px solid rgba(255,255,255,.1);
          border-radius: 980px;
          padding: 8px 14px;
          font-size: 12px;
        }
        .opc-candidate-chip .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--g-400);
        }
        .opc-election-countdown {
          text-align: center;
        }
        .opc-countdown-box {
          background: rgba(212,175,55,.1);
          border: 1px solid rgba(212,175,55,.25);
          border-radius: var(--radius-md);
          padding: 24px;
          min-width: 180px;
        }
        .opc-countdown-num {
          font-size: 36px;
          font-weight: 900;
          color: var(--gold);
          letter-spacing: -1px;
        }
        .opc-countdown-lbl {
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: rgba(255,255,255,.5);
        }

        /* DONATIONS */
        .opc-donations-section {
          padding: 100px 0;
          background: var(--g-900);
        }
        .opc-donate-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
          margin-top: 48px;
        }
        .opc-donate-progress {
          margin-bottom: 28px;
        }
        .opc-progress-label {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: rgba(255,255,255,.65);
          margin-bottom: 8px;
        }
        .opc-progress-bar {
          height: 8px;
          background: rgba(255,255,255,.08);
          border-radius: 980px;
          overflow: hidden;
        }
        .opc-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold-d), var(--gold));
          border-radius: 980px;
          width: 64%;
          transition: width 1s var(--ease-smooth);
        }
        .opc-donate-goal {
          font-size: 12px;
          color: rgba(255,255,255,.4);
          margin-top: 6px;
        }
        .opc-donate-amounts {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .opc-amount-btn {
          padding: 10px 20px;
          border-radius: 980px;
          border: 1px solid rgba(255,255,255,.15);
          font-size: 14px;
          font-weight: 700;
          color: var(--cream);
          background: transparent;
          cursor: pointer;
          transition: .2s;
        }
        .opc-amount-btn.active, .opc-amount-btn:hover {
          background: var(--gold);
          color: var(--g-900);
          border-color: var(--gold);
        }
        .opc-donate-card {
          background: rgba(212,175,55,.06);
          border: 1px solid rgba(212,175,55,.2);
          border-radius: var(--radius-lg);
          padding: 36px;
        }
        .opc-donate-card h3 {
          font-size: 20px;
          font-weight: 800;
          margin-bottom: 8px;
          color: var(--white);
        }
        .opc-donate-card p {
          color: rgba(255,255,255,.6);
          font-size: 13px;
          margin-bottom: 24px;
        }
        .opc-bank-info {
          background: rgba(0,0,0,.2);
          border-radius: var(--radius-sm);
          padding: 16px;
          font-size: 12px;
          color: rgba(255,255,255,.6);
          line-height: 2;
          margin-bottom: 20px;
        }
        .opc-bank-info strong {
          color: var(--white);
          display: block;
        }

        /* SERVICES */
        .opc-services-section {
          padding: 100px 0;
          background: var(--g-800);
        }
        .opc-services-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 48px;
        }
        .opc-service-card {
          background: rgba(255,255,255,.03);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: var(--radius-md);
          padding: 28px;
          transition: border-color .3s, background .3s, transform .3s var(--ease);
          display: flex;
          gap: 18px;
        }
        .opc-service-card:hover {
          border-color: rgba(212,175,55,.3);
          background: rgba(212,175,55,.04);
          transform: translateY(-3px);
        }
        .opc-service-icon {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          background: rgba(212,175,55,.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .opc-service-card h4 {
          font-size: 16px;
          font-weight: 800;
          margin-bottom: 6px;
          color: var(--white);
        }
        .opc-service-card p {
          font-size: 13px;
          color: rgba(255,255,255,.55);
          line-height: 1.6;
        }
        .opc-service-card a {
          font-size: 12px;
          color: var(--gold);
          font-weight: 600;
          margin-top: 10px;
          display: inline-block;
          text-decoration: none;
        }

        /* JOIN CTA */
        .opc-cta-section {
          padding: 120px 0;
          text-align: center;
          background: linear-gradient(180deg, var(--g-800), var(--g-900));
          position: relative;
          overflow: hidden;
        }
        .opc-cta-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          height: 400px;
          background: radial-gradient(ellipse, rgba(212,175,55,.1) 0%, transparent 65%);
          pointer-events: none;
        }
        .opc-cta-section h2 {
          font-size: clamp(32px, 5vw, 60px);
          font-weight: 900;
          letter-spacing: -1.5px;
          margin-bottom: 16px;
          color: var(--white);
        }
        .opc-cta-section h2 span {
          color: var(--gold);
        }
        .opc-cta-section p {
          color: rgba(255,255,255,.6);
          font-size: 16px;
          max-width: 480px;
          margin: 0 auto 36px;
          line-height: 1.6;
        }
        .opc-cta-section .btns {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* FOOTER */
        .opc-footer {
          background: var(--g-900);
          border-top: 1px solid rgba(255,255,255,.06);
          padding: 64px 0 28px;
        }
        .opc-footer-grid {
          display: grid;
          grid-template-columns: 2fr repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 48px;
        }
        .opc-footer-brand .emblem {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--gold-d));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 900;
          color: var(--g-900);
          margin-bottom: 14px;
        }
        .opc-footer-brand p {
          font-size: 13px;
          color: rgba(255,255,255,.45);
          line-height: 1.7;
          max-width: 260px;
        }
        .opc-footer-col h5 {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 16px;
        }
        .opc-footer-col ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .opc-footer-col ul li {
          margin-bottom: 10px;
        }
        .opc-footer-col ul li a {
          font-size: 13px;
          color: rgba(255,255,255,.45);
          transition: .2s;
          text-decoration: none;
        }
        .opc-footer-col ul li a:hover {
          color: var(--white);
        }
        .opc-social-row {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }
        .opc-social-row a {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: .2s;
          text-decoration: none;
        }
        .opc-social-row a:hover {
          background: rgba(212,175,55,.15);
          border-color: rgba(212,175,55,.4);
        }
        .opc-footer-bottom {
          border-top: 1px solid rgba(255,255,255,.06);
          padding-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: rgba(255,255,255,.3);
          flex-wrap: wrap;
          gap: 10px;
        }
        .opc-footer-bottom a {
          color: rgba(255,255,255,.35);
          text-decoration: none;
        }
        .opc-footer-bottom a:hover {
          color: var(--gold);
        }

        /* TOAST */
        .opc-toast {
          position: fixed;
          bottom: 28px;
          right: 28px;
          z-index: 2000;
          background: var(--g-700);
          border: 1px solid rgba(212,175,55,.3);
          border-radius: 14px;
          padding: 16px 20px;
          font-size: 13px;
          box-shadow: 0 20px 50px rgba(0,0,0,.5);
          transform: translateY(80px);
          opacity: 0;
          transition: transform .4s var(--ease), opacity .4s;
          max-width: 300px;
          pointer-events: none;
        }
        .opc-toast.show {
          transform: translateY(0);
          opacity: 1;
          pointer-events: auto;
        }
        .opc-toast strong {
          color: var(--gold);
        }

        /* MOBILE NAV DRAWER */
        .opc-mobile-nav {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: var(--g-900);
          transform: translateX(100%);
          transition: transform .4s var(--ease-smooth);
          display: flex;
          flex-direction: column;
          padding: 28px;
        }
        .opc-mobile-nav.open {
          transform: translateX(0);
        }
        .opc-mobile-nav-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
        }
        .opc-mobile-nav a {
          display: block;
          font-size: 22px;
          font-weight: 800;
          color: var(--white);
          padding: 14px 0;
          border-bottom: 1px solid rgba(255,255,255,.06);
          letter-spacing: -.4px;
          text-decoration: none;
        }
        .opc-mobile-nav a:hover {
          color: var(--gold);
        }
        .opc-close-btn {
          font-size: 24px;
          color: rgba(255,255,255,.6);
          background: none;
          border: none;
          cursor: pointer;
        }

        /* RESPONSIVE */
        @media (max-width: 1000px) {
          .opc-hero { min-height: auto; padding: 112px 0 92px; }
          .opc-hero-content { grid-template-columns: 1fr; gap: 32px; max-width: 760px; }
          .opc-honourees { order: 1; }
          .opc-hero-copy { order: 2; text-align: center; }
          .opc-hero-copy .opc-hero-sub { margin-left: auto; }
          .opc-hero-copy .opc-hero-ctas, .opc-hero-copy .opc-hero-stats { justify-content: center; }
          .opc-card-layout { grid-template-columns: 1fr; }
          .opc-cabinet-president { grid-template-columns: 1fr; }
          .opc-president-stats { flex-direction: row; flex-wrap: wrap; }
          .opc-pres-stat { flex: 1; min-width: 120px; }
          .opc-donate-layout { grid-template-columns: 1fr; }
          .opc-footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .opc-nav-links { display: none; }
          .opc-nav-actions { display: none; }
          .opc-mobile-menu-btn { display: block; }
          .opc-pillars-grid { grid-template-columns: 1fr; }
          .opc-cabinet-grid { grid-template-columns: repeat(2, 1fr); }
          .opc-news-grid { grid-template-columns: 1fr; }
          .opc-election-card { grid-template-columns: 1fr; }
          .opc-services-grid { grid-template-columns: 1fr; }
          .opc-hero-stats { gap: 24px; }
          .opc-honouree-card { width: 178px; height: 240px; }
          .opc-honouree-name { font-size: 15px; }
          .opc-honouree-honor { font-size: 9px; }
          .opc-footer-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 480px) {
          .opc-cabinet-grid { grid-template-columns: 1fr 1fr; }
          .opc-card-item { transform: rotate(-2deg); }
        }
      `}</style>


      {/* ═══ HEADER ═══ */}
      <header className={`opc-header ${scrolled ? 'scrolled' : ''}`}>
        <nav className="opc-nav">
          <div className="opc-nav-logo" onClick={() => scrollTo('home')}>
            <div className="opc-emblem">ع</div>
            <div className="opc-brand-text">
              <div className="name">Oman Pakhtoon Community</div>
              <div className="sub">OPC · Official Portal</div>
            </div>
          </div>
          <ul className="opc-nav-links">
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>About</a></li>
            <li><a href="#cabinet" onClick={(e) => { e.preventDefault(); scrollTo('cabinet'); }}>Cabinet</a></li>
            <li><a href="#news" onClick={(e) => { e.preventDefault(); scrollTo('news'); }}>News</a></li>
            <li><a href="#elections" onClick={(e) => { e.preventDefault(); scrollTo('elections'); }}>Elections</a></li>
            <li><a href="#welfare" onClick={(e) => { e.preventDefault(); scrollTo('welfare'); }}>Welfare</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo('contact'); }}>Contact</a></li>
          </ul>
          <div className="opc-nav-actions">
            <Link to="/admin" className="opc-btn opc-btn-ghost">Member Login</Link>
            <Link to="/membership" className="opc-btn opc-btn-gold">Join OPC</Link>
          </div>
          <button className="opc-mobile-menu-btn" onClick={() => setMobileNavOpen(true)}>☰</button>
        </nav>
      </header>

      {/* Mobile nav */}
      <div className={`opc-mobile-nav ${mobileNavOpen ? 'open' : ''}`}>
        <div className="opc-mobile-nav-head">
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)' }}>OPC</div>
          <button className="opc-close-btn" onClick={() => setMobileNavOpen(false)}>✕</button>
        </div>
        <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>About</a>
        <a href="#cabinet" onClick={(e) => { e.preventDefault(); scrollTo('cabinet'); }}>Cabinet</a>
        <a href="#news" onClick={(e) => { e.preventDefault(); scrollTo('news'); }}>News</a>
        <a href="#elections" onClick={(e) => { e.preventDefault(); scrollTo('elections'); }}>Elections</a>
        <a href="#welfare" onClick={(e) => { e.preventDefault(); scrollTo('welfare'); }}>Welfare</a>
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to="/admin" className="opc-btn opc-btn-ghost" style={{ textAlign: 'center' }}>Member Login</Link>
          <Link to="/membership" className="opc-btn opc-btn-gold" style={{ textAlign: 'center' }}>Join OPC</Link>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section className="opc-hero" id="home">
        <div className="opc-hero-bg">
          <div className="opc-hero-stars"></div>
          <div className="opc-hero-glow"></div>
          {/* Khyber/Swat mountain silhouette SVG */}
          <svg className="opc-mountain-svg" viewBox="0 0 1440 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,400 L0,280 L60,260 L120,240 L180,200 L240,160 L280,140 L320,120 L360,100 L400,80 L420,70 L440,90 L480,130 L510,150 L540,120 L580,80 L620,50 L660,30 L700,20 L720,25 L740,15 L760,25 L800,60 L840,90 L870,80 L900,60 L940,40 L980,20 L1010,10 L1040,20 L1070,50 L1100,80 L1130,100 L1160,120 L1200,150 L1240,180 L1280,220 L1320,250 L1380,270 L1440,280 L1440,400 Z" fill="#d4af37"/>
            <path d="M0,400 L0,310 L80,290 L160,270 L220,250 L260,230 L300,200 L340,180 L380,160 L420,150 L460,160 L500,180 L540,190 L570,175 L600,160 L640,140 L680,120 L720,110 L760,120 L800,140 L840,160 L880,170 L920,160 L960,150 L1000,140 L1040,160 L1080,180 L1120,200 L1160,220 L1200,240 L1260,260 L1340,280 L1440,300 L1440,400 Z" fill="#1b4d3e"/>
          </svg>
        </div>
        <div className="opc-hero-content">
          <div className="opc-honourees" aria-label="Pakhtoon Legends sliding gallery">
            <div className="opc-honourees-label">✦ Pakhtoon Legends</div>
            <div className="opc-honourees-track">
              {heroLegendsLoop.map((legend, index) => (
                <article className="opc-honouree-card" key={`${legend.name}-${index}`}>
                  <img src={legend.image} alt={legend.name} loading={index > 3 ? 'lazy' : 'eager'} />
                  <div className="opc-honouree-caption">
                    <div className="opc-honouree-name">{legend.name}</div>
                    <div className="opc-honouree-honor">{legend.honor}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="opc-hero-copy">
            <div className="opc-hero-eyebrow"><span></span> Established 2018 · Muscat, Oman <span></span></div>
            <h1>United by Roots,<em>Strengthened by Community</em></h1>
            <p className="opc-hero-sub">The official platform for over 1,000 Pakhtoons across Oman — member services, elections, welfare support, and community connection.</p>
            <div className="opc-hero-ctas">
              <Link to="/membership" className="opc-btn opc-btn-gold" style={{ padding: '14px 30px', fontSize: '15px' }}>Become a Member</Link>
              <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }} className="opc-btn opc-btn-ghost" style={{ padding: '14px 30px', fontSize: '15px' }}>Explore OPC</a>
            </div>
            <div className="opc-hero-stats">
              <div className="opc-hero-stat"><div className="num">1,000+</div><div className="lbl">Active Members</div></div>
              <div className="opc-hero-stat"><div className="num">7+</div><div className="lbl">Years in Oman</div></div>
              <div className="opc-hero-stat"><div className="num">24/7</div><div className="lbl">Welfare Support</div></div>
              <div className="opc-hero-stat"><div className="num">12</div><div className="lbl">Cabinet Members</div></div>
            </div>
          </div>
        </div>
        <div className="opc-scroll-indicator" onClick={() => scrollTo('join')} style={{ cursor: 'pointer' }}>
          <div className="arrow"></div>Scroll
        </div>
      </section>

      {/* ═══ MEMBERSHIP CARD ═══ */}
      <section className="opc-card-section" id="join">
        <div className="opc-wrap">
          <div className="opc-card-layout">
            <div className="opc-card-copy">
              <div className="opc-section-label">Membership</div>
              <h2>Your <span>OPC Card</span><br/>— your identity.</h2>
              <p>Every registered member receives a unique digital membership card with a sequential OPC ID. Your card is your proof of community, your access to welfare support, and your vote in elections.</p>
              <div className="opc-card-features">
                <div className="opc-card-feature"><div className="icon">🪪</div> Unique ID: OPC-OM-YYYY-XXXX</div>
                <div className="opc-card-feature"><div className="icon">🗳️</div> Voting rights in all community elections</div>
                <div className="opc-card-feature"><div className="icon">🛡️</div> Access to welfare & incident support</div>
                <div className="opc-card-feature"><div className="icon">📱</div> Digital card, always in your pocket</div>
              </div>
              <Link to="/membership" className="opc-btn opc-btn-gold" style={{ padding: '14px 30px' }}>Register Now — It's Free</Link>
            </div>
            <div>
              <div 
                className="opc-card-item" 
                id="opcCard"
                ref={opcCardRef}
                style={{ transform: cardTransform }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="opc-card-top">
                  <div className="opc-card-emblem">ع</div>
                  <div className="opc-card-org">
                    <div className="org-name">OPC · OMAN</div>
                    <div className="org-sub">MEMBER CARD</div>
                  </div>
                </div>
                <div className="opc-card-mid">
                  <div className="member-name">Shaukat Khan</div>
                  <div className="member-title">Community Member</div>
                </div>
                <div className="opc-card-bottom">
                  <div><div className="opc-member-id">OPC-OM-2024-0001</div></div>
                  <div className="opc-card-valid">Valid Until<span>Dec 2026</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PILLARS ═══ */}
      <section className="opc-pillars-section" id="about">
        <div className="opc-wrap">
          <div className="opc-section-head">
            <div className="opc-section-label">What We Stand For</div>
            <h2>Built to serve,<br/>built to last.</h2>
            <p>OPC exists to unite Pakhtoons in Oman under shared values of brotherhood, dignity, and community service.</p>
          </div>
          <div className="opc-pillars-grid">
            <div className="opc-pillar-card">
              <div className="opc-pillar-icon">🤝</div>
              <h3>Brotherhood</h3>
              <p>Fostering genuine connections among Pakhtoons across all governorates of Oman — Muscat, Sohar, Salalah and beyond.</p>
            </div>
            <div className="opc-pillar-card">
              <div className="opc-pillar-icon">⚖️</div>
              <h3>Advocacy</h3>
              <p>Representing community concerns to embassies, Omani authorities, and employer organizations with one united voice.</p>
            </div>
            <div className="opc-pillar-card">
              <div className="opc-pillar-icon">🛡️</div>
              <h3>Welfare</h3>
              <p>Emergency support, repatriation assistance, legal guidance and welfare for members and their families in times of need.</p>
            </div>
            <div className="opc-pillar-card">
              <div className="opc-pillar-icon">🗳️</div>
              <h3>Democracy</h3>
              <p>A fully elected leadership — every cabinet member chosen by the community through transparent, fair elections.</p>
            </div>
            <div className="opc-pillar-card">
              <div className="opc-pillar-icon">🎓</div>
              <h3>Education</h3>
              <p>Workshops, skill-sharing sessions and guidance on rights, visas, and professional growth for members in Oman.</p>
            </div>
            <div className="opc-pillar-card">
              <div className="opc-pillar-icon">🌿</div>
              <h3>Culture</h3>
              <p>Celebrating Pakhtoon heritage — language, music, and traditions — keeping our roots alive while living abroad.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CABINET ═══ */}
      <section className="opc-cabinet-section" id="cabinet">
        <div className="opc-wrap">
          <div className="opc-section-head">
            <div className="opc-section-label">Leadership</div>
            <h2>Your elected cabinet.</h2>
          </div>

          <div className="opc-cabinet-president">
            <div>
              <div className="opc-president-info">
                <div className="role">OPC Leadership</div>
                <div className="name">Meet the Executive Cabinet</div>
                <p>Our cabinet profiles are displayed directly from the verified OPC leadership records. Only public name, position, and profile image information is shown.</p>
              </div>
            </div>
            <div className="opc-president-stats">
              <div className="opc-pres-stat"><div className="num">{cabinetMembers.length || '—'}</div><div className="lbl">Cabinet members</div></div>
              <div className="opc-pres-stat"><div className="num">OPC</div><div className="lbl">Community leadership</div></div>
            </div>
          </div>

          <div className="opc-cabinet-grid">
            {cabinetMembers.map((member) => {
              const initials = member.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase();

              return (
                <div className="opc-cabinet-card" key={member.id}>
                  <div className="opc-cabinet-avatar">
                    {member.photo ? (
                      <img
                        src={member.photo}
                        alt={`${member.name}, ${member.position}`}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : initials}
                  </div>
                  <div className="role">{member.position}</div>
                  <div className="name">{member.name}</div>
                </div>
              );
            })}
          </div>

          {cabinetLoaded && cabinetMembers.length === 0 && (
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,.6)', marginTop: '22px' }}>
              Cabinet profiles are being prepared for publication.
            </p>
          )}
        </div>
      </section>

      {/* ═══ NEWS ═══ */}
      <section className="opc-news-section" id="news">
        <div className="opc-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div className="opc-section-head">
              <div className="opc-section-label">News & Events</div>
              <h2>Latest from OPC.</h2>
            </div>
            <button onClick={() => triggerToast('Viewing all news archives.')} className="opc-btn opc-btn-ghost">View All →</button>
          </div>
          <div className="opc-news-grid">
            <div className="opc-news-featured" onClick={() => triggerToast('Opening article: Annual OPC Gathering 2026')} style={{ cursor: 'pointer' }}>
              <div className="opc-news-img">🏔️</div>
              <div className="opc-news-body">
                <div className="opc-news-tag">Community Event</div>
                <h3>Annual OPC Gathering 2026 — Muscat</h3>
                <p>Over 300 members attended the annual dinner at Al Hail Community Hall. The evening featured cultural performances, election announcements and a welfare fund review.</p>
                <div className="opc-news-meta">📅 15 July 2026 · Muscat, Oman</div>
              </div>
            </div>
            <div className="opc-news-list">
              <div className="opc-news-item" onClick={() => triggerToast('Opening: Embassy Meeting')} style={{ cursor: 'pointer' }}>
                <div className="opc-news-item-img">🇵🇰</div>
                <div><h4>Embassy Meeting: Visa & Labour Issues Discussed</h4><p>📅 02 Jul 2026</p></div>
              </div>
              <div className="opc-news-item" onClick={() => triggerToast('Opening: Welfare Fund Report')} style={{ cursor: 'pointer' }}>
                <div className="opc-news-item-img">🛡️</div>
                <div><h4>Welfare Fund Distributes OMR 2,400 in June</h4><p>📅 28 Jun 2026</p></div>
              </div>
              <div className="opc-news-item" onClick={() => triggerToast('Opening: Election 2026 Nominations')} style={{ cursor: 'pointer' }}>
                <div className="opc-news-item-img">🗳️</div>
                <div><h4>Election 2026 Nominations Now Open</h4><p>📅 20 Jun 2026</p></div>
              </div>
              <div className="opc-news-item" onClick={() => triggerToast('Opening: Labour Rights Workshop')} style={{ cursor: 'pointer' }}>
                <div className="opc-news-item-img">🎓</div>
                <div><h4>Free Labour Rights Workshop — Sohar</h4><p>📅 10 Jun 2026</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ELECTIONS ═══ */}
      <section className="opc-elections-section" id="elections">
        <div className="opc-wrap opc-elections-inner">
          <div className="opc-section-head">
            <div className="opc-section-label">Elections 2026</div>
            <h2>Your vote shapes<br/>our leadership.</h2>
          </div>
          <div style={{ marginTop: '40px' }}>
            <div className="opc-election-card">
              <div>
                <h3>Presidential Election 2026</h3>
                <p>Nominations are open. All OPC members with valid cards are eligible to vote. Elections will be held digitally through this portal on 15 September 2026.</p>
                <div className="opc-candidate-row">
                  <div className="opc-candidate-chip"><div className="dot"></div>Ikram Bacha (Incumbent)</div>
                  <div className="opc-candidate-chip"><div className="dot"></div>Nominations Open</div>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => triggerToast('Nomination registration form submitted for verification.')} className="opc-btn opc-btn-gold">Nominate Yourself</button>
                  <button onClick={() => triggerToast('Loading all registered candidate dossiers...')} className="opc-btn opc-btn-ghost">View All Candidates</button>
                </div>
              </div>
              <div className="opc-election-countdown">
                <div className="opc-countdown-box">
                  <div className="opc-countdown-num" id="countdown">{daysRemaining}</div>
                  <div className="opc-countdown-lbl">Days Remaining</div>
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.4)', marginTop: '10px' }}>
                  Voting opens<br/>15 Sep 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DONATIONS ═══ */}
      <section className="opc-donations-section" id="donate">
        <div className="opc-wrap">
          <div className="opc-section-head">
            <div className="opc-section-label">Welfare Fund</div>
            <h2>Support your brothers.</h2>
          </div>
          <div className="opc-donate-layout">
            <div>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: '15px', lineHeight: 1.7, marginBottom: '28px' }}>
                Every contribution to the OPC Welfare Fund goes directly to members in emergency — repatriation costs, medical needs, legal aid, and family support. No admin fees.
              </p>
              <div className="opc-donate-progress">
                <div className="opc-progress-label">
                  <span>Welfare Fund — July 2026</span>
                  <span style={{ color: 'var(--gold)' }}>OMR 3,200 / OMR 5,000</span>
                </div>
                <div className="opc-progress-bar">
                  <div className="opc-progress-fill" ref={progressFillRef}></div>
                </div>
                <div className="opc-donate-goal">64% of monthly target reached · 12 members supported</div>
              </div>
              <div className="opc-donate-amounts">
                {['OMR 5', 'OMR 10', 'OMR 25', 'OMR 50'].map(amount => (
                  <button
                    key={amount}
                    className={`opc-amount-btn ${selectedAmount === amount ? 'active' : ''}`}
                    onClick={() => setSelectedAmount(amount)}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              <button
                className="opc-btn opc-btn-gold"
                style={{ padding: '14px 30px' }}
                onClick={() => triggerToast(`Thank you! Processing donation of ${selectedAmount} for Welfare Fund.`)}
              >
                Donate Now ({selectedAmount})
              </button>
            </div>
            <div className="opc-donate-card">
              <h3>Bank Transfer</h3>
              <p>Transfer directly to OPC's welfare account at Bank Dhofar:</p>
              <div className="opc-bank-info">
                <strong>Account Holder</strong> Ikram Bacha
                <strong>Bank</strong> Bank Dhofar
                <strong>IBAN</strong> OM29 0061 0012 XXXX XXXX XXXX
                <strong>Reference</strong> OPC Welfare + Your Name
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>
                Send proof of transfer to our WhatsApp after payment. All donations are recorded and reported monthly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SERVICES / EMBASSY / WELFARE ═══ */}
      <section className="opc-services-section" id="welfare">
        <div className="opc-wrap">
          <div className="opc-section-head">
            <div className="opc-section-label">Member Services</div>
            <h2>We're here when<br/>it matters most.</h2>
          </div>
          <div className="opc-services-grid">
            <div className="opc-service-card">
              <div className="opc-service-icon">🇵🇰</div>
              <div>
                <h4>Embassy Assistance</h4>
                <p>We coordinate with the Pakistani Embassy in Muscat on visa renewals, passport issues, NICOP, and official documentation. Contact us before your appointment.</p>
                <a href="#contact" onClick={(e) => { e.preventDefault(); triggerToast('Opening Embassy Assistance Liaison Desk'); }}>Contact OPC for Embassy Help →</a>
              </div>
            </div>
            <div className="opc-service-card">
              <div className="opc-service-icon">🚨</div>
              <div>
                <h4>Incident Reporting</h4>
                <p>Facing a workplace problem, legal issue, or emergency? Report to OPC and we will mobilize support, connect you with the right contacts, and advocate on your behalf.</p>
                <a href="#contact" onClick={(e) => { e.preventDefault(); triggerToast('Incident reporting triage initialized'); }}>Submit a Report →</a>
              </div>
            </div>
            <div className="opc-service-card">
              <div className="opc-service-icon">✈️</div>
              <div>
                <h4>Repatriation Support</h4>
                <p>For members or families who need emergency repatriation to Pakistan — OPC manages logistics and can provide partial financial assistance from the welfare fund.</p>
                <a href="#contact" onClick={(e) => { e.preventDefault(); triggerToast('Repatriation emergency coordinator summoned'); }}>Request Support →</a>
              </div>
            </div>
            <div className="opc-service-card">
              <div className="opc-service-icon">⚖️</div>
              <div>
                <h4>Labour Rights & Legal Aid</h4>
                <p>Know your rights under Oman's Labour Law. OPC connects members with trusted legal advisors for employment disputes, salary issues, and contract violations.</p>
                <a href="#contact" onClick={(e) => { e.preventDefault(); triggerToast('Labour rights legal guide downloaded'); }}>Learn Your Rights →</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="opc-cta-section" id="register">
        <div className="opc-cta-glow"></div>
        <div className="opc-wrap" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="opc-section-label" style={{ justifyContent: 'center' }}>Join Today</div>
          <h2>Become part of <span>OPC</span>.</h2>
          <p>Registration is free. All Pakhtoons residing in Oman are welcome. Join over 1,000 brothers who have already registered.</p>
          <div className="btns">
            <Link to="/membership" className="opc-btn opc-btn-gold" style={{ padding: '15px 34px', fontSize: '15px' }}>
              Register for Free
            </Link>
            <a 
              href="https://wa.me/96899111870" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="opc-btn opc-btn-green" 
              style={{ padding: '15px 34px', fontSize: '15px' }}
            >
              Contact on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="opc-footer" id="contact">
        <div className="opc-wrap">
          <div className="opc-footer-grid">
            <div className="opc-footer-brand">
              <div className="emblem">ع</div>
              <p style={{ fontSize: '15px', fontWeight: 800, color: 'var(--white)', marginBottom: '8px' }}>Oman Pakhtoon Community</p>
              <p>Connecting Pakhtoons across Oman with pride, service, and brotherhood since 2018.</p>
              <div className="opc-social-row">
                <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook">📘</a>
                <a href="https://wa.me/96899111870" target="_blank" rel="noopener noreferrer" title="WhatsApp">💬</a>
                <a href="#contact" title="Instagram">📷</a>
              </div>
            </div>
            <div className="opc-footer-col">
              <h5>Community</h5>
              <ul>
                <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>About OPC</a></li>
                <li><a href="#cabinet" onClick={(e) => { e.preventDefault(); scrollTo('cabinet'); }}>Cabinet</a></li>
                <li><a href="#elections" onClick={(e) => { e.preventDefault(); scrollTo('elections'); }}>Elections</a></li>
                <li><a href="#news" onClick={(e) => { e.preventDefault(); scrollTo('news'); }}>News & Events</a></li>
              </ul>
            </div>
            <div className="opc-footer-col">
              <h5>Member Services</h5>
              <ul>
                <li><Link to="/membership">Register / Login</Link></li>
                <li><a href="#welfare" onClick={(e) => { e.preventDefault(); scrollTo('welfare'); }}>Welfare Support</a></li>
                <li><a href="#welfare" onClick={(e) => { e.preventDefault(); scrollTo('welfare'); }}>Embassy Help</a></li>
                <li><a href="#welfare" onClick={(e) => { e.preventDefault(); scrollTo('welfare'); }}>Report Incident</a></li>
              </ul>
            </div>
            <div className="opc-footer-col">
              <h5>Contact</h5>
              <ul>
                <li><a href="mailto:opc.oman.official@gmail.com">Email OPC</a></li>
                <li><a href="https://wa.me/96899111870" target="_blank" rel="noopener noreferrer">WhatsApp</a></li>
                <li><a href="#donate" onClick={(e) => { e.preventDefault(); scrollTo('donate'); }}>Donate to Welfare</a></li>
                <li><a href="#contact" onClick={(e) => { e.preventDefault(); triggerToast('Privacy Policy'); }}>Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="opc-footer-bottom">
            <span>© 2026 Oman Pakhtoon Community. All rights reserved.</span>
            <span>Muscat, Oman · <a href="#privacy" onClick={(e) => { e.preventDefault(); triggerToast('Privacy Policy'); }}>Privacy</a> · <a href="#terms" onClick={(e) => { e.preventDefault(); triggerToast('Terms of Service'); }}>Terms</a></span>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      <div className={`opc-toast ${showToast ? 'show' : ''}`} id="toast">
        <strong>✅ Action received!</strong><br/>
        {toastMessage || 'Our team will reach out via WhatsApp shortly.'}
      </div>
    </div>
  );
}
