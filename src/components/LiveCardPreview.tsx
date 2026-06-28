import { useEffect, useRef } from 'react';
import pukhtoonLogo from '../assets/images/pukhtoon_logo_1781303873200.jpg';
import { getCardColor, CARD_COLORS } from './CardColors';

interface LiveCardPreviewProps {
  name: string;
  father: string;
  district: string;
  phone: string;
  photo: string;
  cardColor: string;
}

const loadImage = (src: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      resolve(null);
    };
    img.src = src;
  });
};

export default function LiveCardPreview({
  name,
  father,
  district,
  phone,
  photo,
  cardColor
}: LiveCardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;

    const renderPreview = async () => {
      const [photoImg, logoImg] = await Promise.all([
        loadImage(photo || ''),
        loadImage(pukhtoonLogo)
      ]);

      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // 1. Background gradient based on selected color
      const selectedPalette = getCardColor(cardColor || 'emerald');
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, selectedPalette.primary);
      grad.addColorStop(1, selectedPalette.secondary);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // 2. Oman Flag Stripe top
      ctx.fillStyle = '#c8102e';
      ctx.fillRect(0, 0, W, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 12, W, 6);

      // 3. Gold border
      ctx.strokeStyle = selectedPalette.labelColor;
      ctx.lineWidth = 6;
      ctx.strokeRect(8, 26, W - 16, H - 34);

      // 4. Draw Faded Watermark Background in card center
      if (logoImg) {
        ctx.save();
        ctx.globalAlpha = 0.08;
        const watermarkSize = 340;
        ctx.drawImage(logoImg, (W - watermarkSize) / 2, (H - watermarkSize) / 2 + 15, watermarkSize, watermarkSize);
        ctx.restore();
      }

      // 5. Draw community logo as emblem in the top left
      if (logoImg) {
        ctx.beginPath();
        ctx.arc(102, 88, 48, 0, Math.PI * 2);
        ctx.closePath();
        ctx.strokeStyle = selectedPalette.labelColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.save();
        ctx.clip();
        ctx.drawImage(logoImg, 54, 40, 96, 96);
        ctx.restore();
      }

      // 6. Header Text
      ctx.fillStyle = selectedPalette.labelColor;
      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('OMAN PAKHTOON COMMUNITY', W / 2 + 40, 90);
      ctx.font = '20px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#faf6ed';
      ctx.fillText('MEMBERSHIP IDENTITY CARD', W / 2 + 40, 122);

      // 7. Details
      const x = 305;
      let y = 194;
      const lh = 46;

      const row = (label: string, val: string) => {
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = selectedPalette.labelColor;
        ctx.fillText(label.toUpperCase(), x, y);
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = selectedPalette.textColor;
        ctx.fillText(val || '-', x, y + 24);
        y += lh;
      };

      row('Name', name || '(Your Name Here)');
      row('Father Name', father || '(Father Name Here)');
      row('District', district || 'KPK, Pakistan');
      row('Membership ID', 'PENDING APPROVAL');
      row('Mobile', phone || '(Phone No. Here)');

      // Standard bottom line
      ctx.font = '15px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = selectedPalette.labelColor;
      ctx.fillText('ISSUED: PENDING', x, H - 46);
      ctx.textAlign = 'right';
      ctx.fillText('Valid: Lifetime Member', W - 40, H - 46);

      // 8. Profile photo box
      ctx.strokeStyle = selectedPalette.labelColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(60, 165, 210, 255);

      if (photoImg) {
        ctx.drawImage(photoImg, 60, 165, 210, 255);
      } else {
        ctx.fillStyle = selectedPalette.secondary;
        ctx.fillRect(61, 166, 208, 253);
        ctx.fillStyle = '#faf6ed';
        ctx.font = 'bold 80px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText((name || '?').charAt(0).toUpperCase(), 165, 305);
      }

      // 8.5 Emergency Helplines Section
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.fillRect(60, 458, W - 120, 68);
      ctx.strokeStyle = selectedPalette.labelColor + '44';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 458, W - 120, 68);

      // Title
      ctx.font = 'bold 10.5px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = selectedPalette.labelColor;
      ctx.textAlign = 'center';
      ctx.fillText('🚨 OPC EMERGENCY HELPLINES', W / 2, 476);

      // Columns
      ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      
      // Single Row layout with larger font
      ctx.fillText('PRES: +968 96164017', W / 2 - 330, 508);
      ctx.fillText('CO-PRES: +968 95079400', W / 2 - 110, 508);
      ctx.fillText('MUSCAT: +968 99111870', W / 2 + 110, 508);
      ctx.fillText('SALALAH: +968 96766876', W / 2 + 330, 508);

      // 9. Unapproved Draft Overlay/Watermark
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.25);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.17)';
      ctx.font = '90px "Segoe UI", Arial, sans-serif font-sans font-bold';
      ctx.textAlign = 'center';
      ctx.fillText('LIVE PREVIEW', 0, 0);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 5;
      ctx.strokeRect(-350, -80, 700, 120);
      ctx.restore();
    };

    renderPreview();

    return () => {
      active = false;
    };
  }, [name, father, district, phone, photo, cardColor]);

  return (
    <div className="bg-slate-900 border border-slate-700 p-5 rounded-2xl shadow-xl flex flex-col items-center">
      <div className="flex items-center justify-between w-full border-b border-slate-800 pb-3 mb-4">
        <h4 className="text-white font-serif font-bold text-sm tracking-wide">
          🎴 Real-Time Membership Card Preview
        </h4>
        <span className="text-[10px] uppercase font-bold text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/30">
          Unapproved Draft
        </span>
      </div>
      
      <div className="w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <canvas
          ref={canvasRef}
          width="1011"
          height="638"
          className="w-full aspect-[1011/638] block"
        />
      </div>

      <div className="mt-4 text-left w-full space-y-2">
        <p className="text-slate-450 text-[11px] leading-relaxed">
          💡 This represents an active rendering of your lifetime membership card. You can configure your color choice below and see it compile in real-time.
        </p>
        <p className="text-amber-400 text-[11px] font-semibold flex items-center gap-1">
          🔒 Download option becomes available immediately after executive committee review and approval.
        </p>
      </div>
    </div>
  );
}
