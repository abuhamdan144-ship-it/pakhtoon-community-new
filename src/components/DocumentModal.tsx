import { useEffect, useRef } from 'react';
import { Member } from '../types';
import { X, Download } from 'lucide-react';
import pukhtoonLogo from '../assets/images/pukhtoon_logo_1781303873200.jpg';

interface DocumentModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
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
      console.warn("Failed to load image path:", src);
      resolve(null);
    };
    img.src = src;
  });
};

export default function DocumentModal({ member, isOpen, onClose }: DocumentModalProps) {
  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isOpen || !member) return;

    let active = true;

    // Preload both images first to ensure neat, synchronous, flicker-free canvas painting.
    const renderDocuments = async () => {
      const [photoImg, logoImg] = await Promise.all([
        loadImage(member.photo || ''),
        loadImage(pukhtoonLogo)
      ]);

      if (!active) return;

      // --- Draw Membership Card (1011x638) ---
      const drawCard = () => {
        const canvas = cardCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        ctx.clearRect(0, 0, W, H);
        
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#1b4d3e');
        grad.addColorStop(1, '#0e2e25');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Oman Flag Stripe top
        ctx.fillStyle = '#c8102e';
        ctx.fillRect(0, 0, W, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 12, W, 6);

        // Gold border
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 6;
        ctx.strokeRect(8, 26, W - 16, H - 34);

        // Draw Faded Watermark Background in card center
        if (logoImg) {
          ctx.save();
          ctx.globalAlpha = 0.08; // Subtle background watermark opacity
          const watermarkSize = 340;
          ctx.drawImage(logoImg, (W - watermarkSize) / 2, (H - watermarkSize) / 2 + 15, watermarkSize, watermarkSize);
          ctx.restore();
        }

        // Draw community logo as emblem in the top left
        if (logoImg) {
          ctx.beginPath();
          ctx.arc(102, 88, 48, 0, Math.PI * 2);
          ctx.closePath();
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.save();
          ctx.clip();
          ctx.drawImage(logoImg, 54, 40, 96, 96);
          ctx.restore();
        }

        // Header Text
        ctx.fillStyle = '#d4af37';
        ctx.font = 'bold 36px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('OMAN PAKHTOON COMMUNITY', W / 2 + 40, 90);
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#faf6ed';
        ctx.fillText('MEMBERSHIP IDENTITY CARD', W / 2 + 40, 122);

        // Details drawing function
        const drawInfoText = () => {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#faf6ed';
          const x = 305;
          let y = 200;
          const lh = 48;

          const row = (label: string, val: string) => {
            ctx.font = '16px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#d4af37';
            ctx.fillText(label.toUpperCase(), x, y);
            ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(val || '-', x, y + 26);
            y += lh;
          };

          row('Name', member.name);
          row('Father Name', member.father);
          row('District', member.district || 'KPK, Pakistan');
          row('Membership ID', member.membershipId || 'PENDING');
          row('Mobile', member.phone);

          // Issued & expiry
          ctx.font = '16px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = '#d4af37';
          ctx.fillText('ISSUED: ' + new Date(member.approvedAt?.seconds ? member.approvedAt.seconds * 1000 : Date.now()).toLocaleDateString('en-GB'), x, H - 50);
          ctx.textAlign = 'right';
          ctx.fillText('Valid: Lifetime Member', W - 40, H - 50);
        };

        // Profile photo box
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 165, 210, 255);

        if (photoImg) {
          ctx.drawImage(photoImg, 60, 165, 210, 255);
        } else {
          ctx.fillStyle = '#1b4d3e';
          ctx.fillRect(61, 166, 208, 253);
          ctx.fillStyle = '#faf6ed';
          ctx.font = 'bold 80px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText((member.name || '?').charAt(0).toUpperCase(), 165, 305);
        }
        drawInfoText();
      };

      // --- Draw Certificate of Membership (1400x990) ---
      const drawCertificate = () => {
        const canvas = certCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#faf6ed';
        ctx.fillRect(0, 0, W, H);

        // Border 1
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 14;
        ctx.strokeRect(20, 20, W - 40, H - 40);

        // Border 2 (Green)
        ctx.strokeStyle = '#1b4d3e';
        ctx.lineWidth = 3;
        ctx.strokeRect(42, 42, W - 84, H - 84);

        // Draw Faded Watermark Background in certificate center
        if (logoImg) {
          ctx.save();
          ctx.globalAlpha = 0.05; // Delicate watermark density for text readability
          const watermarkSize = 510;
          ctx.drawImage(logoImg, (W - watermarkSize) / 2, (H - watermarkSize) / 2 + 50, watermarkSize, watermarkSize);
          ctx.restore();
        }

        // Draw community logo above header as credential badge
        if (logoImg) {
          ctx.beginPath();
          ctx.arc(W / 2, 130, 60, 0, Math.PI * 2);
          ctx.closePath();
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.save();
          ctx.clip();
          ctx.drawImage(logoImg, W / 2 - 60, 70, 120, 120);
          ctx.restore();
        }

        // Headers
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1b4d3e';
        ctx.font = 'bold 44px Georgia, serif';
        ctx.fillText('OMAN PAKHTOON COMMUNITY', W / 2, 255);

        ctx.font = '28px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#c8102e';
        ctx.fillText('CERTIFICATE OF MEMBERSHIP', W / 2, 305);

        ctx.font = '22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText('This certificate is proudly presented to', W / 2, 395);

        // Name
        ctx.font = 'bold 52px Georgia, serif';
        ctx.fillStyle = '#1b4d3e';
        ctx.fillText(member.name || '-', W / 2, 475);

        // Body text
        ctx.font = '22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText('in recognition of their registration as an official member of the', W / 2, 535);
        ctx.fillText('Oman Pakhtoon Community welfare network, Sultanate of Oman.', W / 2, 570);

        ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#1b4d3e';
        ctx.fillText('Membership ID: ' + (member.membershipId || '-'), W / 2, 645);

        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#666666';
        const approvedDateString = new Date(member.approvedAt?.seconds ? member.approvedAt.seconds * 1000 : Date.now()).toLocaleDateString('en-GB');
        ctx.fillText('Date of Issue: ' + approvedDateString, W / 2, 685);

        // Signature line 1
        ctx.textAlign = 'left';
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(150, 830);
        ctx.lineTo(450, 830);
        ctx.stroke();
        ctx.font = '18px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText('President, OPC', 150, 860);

        // Signature line 2
        ctx.textAlign = 'right';
        ctx.beginPath();
        ctx.moveTo(W - 150, 830);
        ctx.lineTo(W - 450, 830);
        ctx.stroke();
        ctx.fillText('General Secretary, OPC', W - 150, 860);
      };

      drawCard();
      drawCertificate();
    };

    renderDocuments();

    return () => {
      active = false;
    };
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const handleDownloadCard = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPC-Card-${member.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handleDownloadCert = () => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPC-Certificate-${member.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-serif text-emerald-950 font-bold mb-4">
          Member Documents: {member.name}
        </h3>

        <div className="space-y-6">
          {/* Card Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-2">
              Membership ID Card
            </span>
            <div className="overflow-x-auto">
              <canvas 
                ref={cardCanvasRef} 
                width="1011" 
                height="638" 
                className="w-full max-w-[500px] mx-auto bg-emerald-950 border border-slate-300 rounded shadow-sm block"
              />
            </div>
            <div className="text-center mt-3">
              <button 
                onClick={handleDownloadCard} 
                className="inline-flex items-center gap-1.5 btn bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold text-xs px-4 py-2 rounded-md transition duration-150 cursor-pointer"
              >
                <Download size={14} /> Download card PNG
              </button>
            </div>
          </div>

          {/* Certificate Section */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-2">
              Lifetime Membership Certificate
            </span>
            <div className="overflow-x-auto">
              <canvas 
                ref={certCanvasRef} 
                width="1400" 
                height="990" 
                className="w-full max-w-[500px] mx-auto bg-cream border border-slate-300 rounded shadow-sm block"
              />
            </div>
            <div className="text-center mt-3">
              <button 
                onClick={handleDownloadCert} 
                className="inline-flex items-center gap-1.5 btn bg-amber-500 hover:bg-amber-600 text-emerald-950 font-semibold text-xs px-4 py-2 rounded-md transition duration-150 cursor-pointer"
              >
                <Download size={14} /> Download Certificate PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
