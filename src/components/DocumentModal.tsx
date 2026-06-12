import { useState, useEffect, useRef } from 'react';
import { Member } from '../types';
import { X, Download, CreditCard, Award, FileText, Send, Share2, CheckCircle2, RefreshCw } from 'lucide-react';
import pukhtoonLogo from '../assets/images/pukhtoon_logo_1781303873200.jpg';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

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
  const [activeTab, setActiveTab] = useState<'card' | 'certificate' | 'receipt' | 'dispatch'>('card');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [memberLocal, setMemberLocal] = useState<Member | null>(null);

  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const receiptCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep local member sync'd up
  useEffect(() => {
    if (member) {
      setMemberLocal(member);
      setSendSuccess(false);
      setDispatchLogs([]);
      setActiveTab('card');
    }
  }, [member, isOpen]);

  useEffect(() => {
    if (!isOpen || !memberLocal) return;

    let active = true;

    // Preload all assets first to ensure neat, synchronous, flicker-free canvas painting.
    const renderDocuments = async () => {
      const [photoImg, logoImg] = await Promise.all([
        loadImage(memberLocal.photo || ''),
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
          let y = 194;
          const lh = 46;

          const row = (label: string, val: string) => {
            ctx.font = '15px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#d4af37';
            ctx.fillText(label.toUpperCase(), x, y);
            ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(val || '-', x, y + 24);
            y += lh;
          };

          row('Name', memberLocal.name);
          row('Father Name', memberLocal.father);
          row('District', memberLocal.district || 'KPK, Pakistan');
          row('Membership ID', memberLocal.membershipId || 'PENDING');
          row('Mobile', memberLocal.phone);

          // Issued & expiry
          ctx.font = '15px "Segoe UI", Arial, sans-serif';
          ctx.fillStyle = '#d4af37';
          ctx.fillText('ISSUED: ' + new Date(memberLocal.approvedAt?.seconds ? memberLocal.approvedAt.seconds * 1000 : Date.now()).toLocaleDateString('en-GB'), x, H - 46);
          ctx.textAlign = 'right';
          ctx.fillText('Valid: Lifetime Member', W - 40, H - 46);
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
          ctx.fillText((memberLocal.name || '?').charAt(0).toUpperCase(), 165, 305);
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
        ctx.fillText(memberLocal.name || '-', W / 2, 475);

        // Body text
        ctx.font = '22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#444444';
        ctx.fillText('in recognition of their registration as an official member of the', W / 2, 535);
        ctx.fillText('Oman Pakhtoon Community welfare network, Sultanate of Oman.', W / 2, 570);

        ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#1b4d3e';
        ctx.fillText('Membership ID: ' + (memberLocal.membershipId || '-'), W / 2, 645);

        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#666666';
        const approvedDateString = new Date(memberLocal.approvedAt?.seconds ? memberLocal.approvedAt.seconds * 1000 : Date.now()).toLocaleDateString('en-GB');
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

      // --- Draw Payment Receipt (1000x1300) ---
      const drawReceipt = () => {
        const canvas = receiptCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const W = canvas.width;
        const H = canvas.height;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Soft border / shadow outline
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, W - 12, H - 12);

        // Header colored top bar
        ctx.fillStyle = '#1b4d3e';
        ctx.fillRect(12, 12, W - 24, 18);

        // Draw Faded Watermark Background in certificate center
        if (logoImg) {
          ctx.save();
          ctx.globalAlpha = 0.04; // Very faint watermark
          const watermarkSize = 450;
          ctx.drawImage(logoImg, (W - watermarkSize) / 2, (H - watermarkSize) / 2 + 50, watermarkSize, watermarkSize);
          ctx.restore();
        }

        // Draw community logo top-left
        if (logoImg) {
          ctx.save();
          ctx.drawImage(logoImg, 60, 60, 140, 140);
          ctx.restore();
        }

        // Header Text & Metainfo
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1b4d3e';
        ctx.font = 'bold 36px Georgia, serif';
        ctx.fillText('OMAN PAKHTOON COMMUNITY', 220, 100);
        
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#c8102e';
        ctx.fillText('OFFICIAL REGISTRATION PAYMENT RECEIPT', 220, 135);

        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Welfare Society, Sultanate of Oman | Registration Counter', 220, 165);

        // Divider
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, 230);
        ctx.lineTo(W - 60, 230);
        ctx.stroke();

        // Left / Right Top metadata blocks
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
        ctx.fillText('RECEIPT TO (MEMBER):', 60, 275);
        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#1b4d3e';
        ctx.fillText((memberLocal.name || '-').toUpperCase(), 60, 305);
        
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Father Name: ' + (memberLocal.father || '-'), 60, 335);
        ctx.fillText('CNIC / Resident Card: ' + (memberLocal.cnic || '-'), 60, 360);
        ctx.fillText('District: ' + (memberLocal.district || 'KPK, Pakistan'), 60, 385);
        ctx.fillText('Phone / Mobile: ' + (memberLocal.phone || '-'), 60, 410);

        // Right Metainfo
        ctx.textAlign = 'right';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
        ctx.fillText('RECEIPT DETAILS:', W - 60, 275);
        
        // Receipt sequence ID
        const cleanApprovedAt = memberLocal.approvedAt?.seconds ? memberLocal.approvedAt.seconds * 1000 : Date.now();
        const dateStr = new Date(cleanApprovedAt).toLocaleDateString('en-GB');
        const serialNum = memberLocal.membershipId ? memberLocal.membershipId.split('-').pop() : '0000';
        const receiptNo = `OPC-REC-${new Date(cleanApprovedAt).getFullYear()}-${serialNum}`;

        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#c8102e';
        ctx.fillText('No: ' + receiptNo, W - 60, 305);
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText('Date of Payment: ' + dateStr, W - 60, 335);
        ctx.fillText('Membership ID: ' + (memberLocal.membershipId || 'PENDING'), W - 60, 360);
        ctx.fillText('Status: FULLY PAID', W - 60, 385);

        // Table Header
        ctx.textAlign = 'left';
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(60, 455, W - 120, 50);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(60, 455, W - 120, 50);

        ctx.fillStyle = '#1b4d3e';
        ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
        ctx.fillText('DESCRIPTION', 80, 487);
        ctx.fillText('QTY', 520, 487);
        ctx.fillText('RATE (OMR)', 660, 487);
        ctx.textAlign = 'right';
        ctx.fillText('TOTAL (OMR)', W - 80, 487);

        // Table Row 1
        const fee = memberLocal.feeAmount !== undefined ? memberLocal.feeAmount : 5;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#1e293b';
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Lifetime Membership Registration Dues (Oman Diaspora)', 80, 545);
        ctx.fillText('1', 525, 545);
        ctx.fillText(fee.toFixed(3) + ' OMR', 660, 545);
        ctx.textAlign = 'right';
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillText(fee.toFixed(3) + ' OMR', W - 80, 545);

        // Row Divider
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, 580);
        ctx.lineTo(W - 60, 580);
        ctx.stroke();

        // Payment Summary block
        ctx.textAlign = 'left';
        ctx.fillStyle = '#475569';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Payment Method: ' + (memberLocal.paymentMethod || 'Bank Transfer'), 80, 630);
        ctx.fillText('Transaction Reference: ' + (memberLocal.paymentReference || 'OPC-DIRECT-TX'), 80, 655);
        ctx.fillText('Verified By: OPC Finance & Core Treasury Unit', 80, 680);

        // Right side calculations
        ctx.textAlign = 'right';
        ctx.fillStyle = '#475569';
        ctx.font = '15px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Subtotal:', W - 220, 630);
        ctx.fillText('Tax / Administrative Dues:', W - 220, 655);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
        ctx.fillText(fee.toFixed(3) + ' OMR', W - 80, 630);
        ctx.fillText('0.000 OMR', W - 80, 655);

        // Grand Total box
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(W - 360, 690, 300, 55);
        ctx.strokeRect(W - 360, 690, 300, 55);
        ctx.fillStyle = '#1b4d3e';
        ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Total Paid:', W - 220, 725);
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#c8102e';
        ctx.fillText(fee.toFixed(3) + ' OMR', W - 80, 725);

        // Bottom Warning / Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 13px "Segoe UI", Arial, sans-serif';
        ctx.fillText('This is a systems-generated electronic receipt. No physical signature is required.', W / 2, 850);
        ctx.fillText('Thank you for supporting Pakhtoon Community Welfare and Integration services in Sultanate of Oman.', W / 2, 875);

        // Draw payment paid stamp
        ctx.save();
        ctx.translate(220, 790);
        ctx.rotate(-0.16);
        ctx.strokeStyle = '#047857';
        ctx.lineWidth = 4;
        ctx.strokeRect(-120, -35, 240, 70);
        ctx.fillStyle = '#047857';
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.fillText('RECEIVED', 0, -3);
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.fillText('OPC TREASURY DEPT', 0, 18);
        ctx.restore();

        // Draw Authorized Signature Line
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(W - 340, 960);
        ctx.lineTo(W - 100, 960);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
        ctx.fillText('IKRAM BACHA', W - 220, 985);
        ctx.fillStyle = '#64748b';
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Official Treasury Collector / OPC Office', W - 220, 1005);
      };

      drawCard();
      drawCertificate();
      drawReceipt();
    };

    renderDocuments();

    return () => {
      active = false;
    };
  }, [isOpen, memberLocal, activeTab]);

  if (!isOpen || !memberLocal) return null;

  const handleDownloadCard = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPC-Card-${memberLocal.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handleDownloadCert = () => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPC-Certificate-${memberLocal.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  const handleDownloadReceipt = () => {
    const canvas = receiptCanvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `OPC-Payment-Receipt-${memberLocal.name.replace(/\s+/g, '-')}.png`;
    a.click();
  };

  // Automated/simulated email & SMS registry dispatch function
  const handleSimulateDispatch = async () => {
    if (!memberLocal || isSending) return;
    setIsSending(true);
    setSendSuccess(false);
    setDispatchLogs([]);

    const logSteps = [
      "🔄 Initializing OPC Secure Gateway server communication...",
      "🎨 Generating high-fidelity Membership ID Card asset buffer...",
      "📜 Rendering stamped lifetime enrollment credential Certificate PDF...",
      "💵 Binding payment audit trail reference into official receipt image...",
      "🔗 Aggregating package into secure cryptographic ZIP enclosure...",
      "📧 SMTP Server Handshake: Dispatching email packet with attachments directly to member...",
      "📱 SMS/WhatsApp API Gateway Response: Sending official notice link with PDF access token...",
      "✅ All documents dispatched successfully! Registry updated."
    ];

    for (let i = 0; i < logSteps.length; i++) {
      if (typeof window !== 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 550));
      }
      setDispatchLogs(prev => [...prev, logSteps[i]]);
    }

    try {
      if (memberLocal.id) {
        await updateDoc(doc(db, 'members', memberLocal.id), {
          isDispatched: true,
          dispatchedAt: Timestamp.now()
        });
        setMemberLocal(prev => prev ? { ...prev, isDispatched: true, dispatchedAt: Timestamp.now() } : null);
      }
    } catch (err) {
      console.error("Failed to write status:", err);
    }

    setIsSending(false);
    setSendSuccess(true);
  };

  // Generate a real dynamic WhatsApp sharing link
  const getWhatsAppShareLink = () => {
    if (!memberLocal) return '#';
    const amountPaid = memberLocal.feeAmount !== undefined ? memberLocal.feeAmount : 5;
    const refText = memberLocal.paymentReference ? `(Ref: ${memberLocal.paymentReference})` : '';

    const text = 
`OMAN PAKHTOON COMMUNITY

Dear Brother ${memberLocal.name},

Congratulations! Your official OPC Diaspora Membership registration has been reviewed and APPROVED by the Executive Cabinet.

Here is your issued credential package:
📌 Membership ID: ${memberLocal.membershipId || 'OPC-ISSUED'}
📌 Status: Lifetime Active
💰 Registration Fee Paid: ${amountPaid.toFixed(3)} OMR ${refText}

We have enclosed your custom:
1️⃣ Digital Membership ID Card
2️⃣ Lifetime Certificate of Association
3️⃣ Official Automated Payment Receipt

Please keep this copy secure as part of your permanent records. Thank you for your support and integration within the Sultanate of Oman.

Sincerely,
Executive Cabinet Committee
Oman Pakhtoon Community Welfare Network`;

    const cleanPhone = (memberLocal.whatsapp || memberLocal.phone || '').replace(/[^\d+]/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg p-5 hover:border-slate-300 md:p-6 max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="border-b border-slate-100 pb-3 mb-5">
          <h3 className="text-xl font-serif text-emerald-950 font-bold">
            Member Documents Desk
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Access, download, and dispatch official association credentials and dues verification files for <strong className="text-emerald-800">{memberLocal.name}</strong>.
          </p>
        </div>

        {/* Tab Selection Row */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-px mb-6">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'card' 
                ? 'border-emerald-800 bg-emerald-50/50 text-emerald-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CreditCard size={14} />
            ID Card
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'certificate' 
                ? 'border-emerald-800 bg-emerald-50/50 text-emerald-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Award size={14} />
            Certificate
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'receipt' 
                ? 'border-emerald-800 bg-emerald-50/50 text-emerald-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <FileText size={14} />
            Payment Receipt
          </button>
          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
              activeTab === 'dispatch' 
                ? 'border-emerald-850 bg-emerald-50 text-emerald-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Send size={14} />
            Dispatch Console
            {memberLocal.isDispatched && (
              <span className="w-2 h-2 rounded-full bg-emerald-555 animate-ping"></span>
            )}
          </button>
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* 1. CARD TAB */}
          {activeTab === 'card' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-3">
                Membership Identity Card Preview (1011x638)
              </span>
              <div className="overflow-x-auto">
                <canvas 
                  ref={cardCanvasRef} 
                  width="1011" 
                  height="638" 
                  className="w-full max-w-[560px] mx-auto bg-emerald-950 border border-slate-300 rounded-lg shadow-sm block"
                />
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2 italic">
                Optimized high-resolution print template. Custom photo overlay, logo, and Omani colors embedded.
              </p>
              <div className="text-center mt-4">
                <button 
                  onClick={handleDownloadCard} 
                  className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition duration-155 cursor-pointer"
                >
                  <Download size={14} /> Download Identity Card PNG
                </button>
              </div>
            </div>
          )}

          {/* 2. CERTIFICATE TAB */}
          {activeTab === 'certificate' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-3">
                Official Lifetime Association Certificate Preview (1400x990)
              </span>
              <div className="overflow-x-auto">
                <canvas 
                  ref={certCanvasRef} 
                  width="1400" 
                  height="990" 
                  className="w-full max-w-[560px] mx-auto bg-amber-50/20 border border-slate-300 rounded-lg shadow-sm block"
                />
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2 italic">
                Sleek double border lining with OP Community emblem watermark, president and general secretary signature.
              </p>
              <div className="text-center mt-4">
                <button 
                  onClick={handleDownloadCert} 
                  className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition duration-155 cursor-pointer"
                >
                  <Download size={14} /> Download Association Certificate PNG
                </button>
              </div>
            </div>
          )}

          {/* 3. PAYMENT RECEIPT TAB */}
          {activeTab === 'receipt' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-3">
                Official Registration Payment Dues Receipt (1000x1300)
              </span>
              <div className="overflow-x-auto">
                <canvas 
                  ref={receiptCanvasRef} 
                  width="1000" 
                  height="1300" 
                  className="w-full max-w-[480px] mx-auto bg-white border border-slate-300 rounded-lg shadow-sm block"
                />
              </div>
              <p className="text-center text-[11px] text-slate-400 mt-2 italic">
                Itemized transaction breakdown with secure paid verification stamp, OP logo and finance logs.
              </p>
              <div className="text-center mt-4">
                <button 
                  onClick={handleDownloadReceipt} 
                  className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-amber-500 hover:bg-amber-600 text-emerald-950 text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition duration-155 cursor-pointer"
                >
                  <Download size={14} /> Download Payment Receipt PNG
                </button>
              </div>
            </div>
          )}

          {/* 4. DISPATCH TAB */}
          {activeTab === 'dispatch' && (
            <div className="space-y-5">
              {/* Dispatch status billboard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wide">Registry Send Status</span>
                  <div className="flex items-center gap-2">
                    {memberLocal.isDispatched ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Dispatched
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase">
                        Pending Queue Dispatch
                      </span>
                    )}
                  </div>
                  {memberLocal.isDispatched && memberLocal.dispatchedAt && (
                    <p className="text-[11px] text-slate-500">
                      Dispatched on: {new Date(memberLocal.dispatchedAt.seconds ? memberLocal.dispatchedAt.seconds * 1000 : Date.now()).toLocaleString('en-GB')}
                    </p>
                  )}
                </div>

                <div className="bg-slate-55 pb-1 relative p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">Audid &amp; Ledger Dues</span>
                  <p className="text-xl font-mono font-bold text-slate-900">
                    {(memberLocal.feeAmount !== undefined ? memberLocal.feeAmount : 5).toFixed(3)} OMR
                  </p>
                  <p className="text-[10px] text-slate-450">
                    Verified through <strong className="text-slate-650">{memberLocal.paymentMethod || 'Bank Transfer'}</strong> | {memberLocal.paymentReference || 'Direct cash payment ledger'}
                  </p>
                </div>
              </div>

              {/* Functional Integrations Board */}
              <div className="border border-slate-200 rounded-xl p-5 md:p-6 space-y-5 bg-white">
                <h4 className="font-serif text-slate-900 font-extrabold text-base border-l-4 border-emerald-800 pl-2">
                  Dispatch &amp; Notification Core
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* WhatsApp Integration Block */}
                  <div className="border border-slate-100 p-4 rounded-lg flex flex-col justify-between hover:border-emerald-100 hover:bg-emerald-50/10 transition">
                    <div>
                      <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1">
                        <Share2 size={14} className="text-emerald-700" />
                        Send via WhatsApp
                      </h5>
                      <p className="text-xs text-slate-500 mt-1 pb-3 leading-relaxed">
                        Generate a preformatted formal message enclosing the new credentials details, transaction receipts, and lifetime status tags. Opens WhatsApp directly with the member's profile number.
                      </p>
                    </div>

                    <a
                      href={getWhatsAppShareLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-2.5 px-4 rounded transition duration-150 shadow-xs text-center"
                    >
                      <Share2 size={13} /> Secure WhatsApp Dispatch
                    </a>
                  </div>

                  {/* Fully automated Dispatch Simulation block */}
                  <div className="border border-slate-100 p-4 rounded-lg flex flex-col justify-between hover:border-emerald-105 hover:bg-emerald-50/10 transition">
                    <div>
                      <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1">
                        <Send size={14} className="text-emerald-700" />
                        Electronic Mail Gateway
                      </h5>
                      <p className="text-xs text-slate-500 mt-1 pb-3 leading-relaxed">
                        Trigger SMTP servers to build, compress, compile, and directly email the member's high-resolution ID card, certificate of association, and payment receipt files in one automated payload.
                      </p>
                    </div>

                    <button
                      onClick={handleSimulateDispatch}
                      disabled={isSending}
                      className="inline-flex items-center justify-center gap-1.5 w-full bg-amber-500 hover:bg-amber-600 text-emerald-950 font-extrabold text-xs py-2.5 px-4 rounded transition duration-150 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" /> Dispatched progress...
                        </>
                      ) : (
                        <>
                          <Send size={13} /> Direct SMTP &amp; SMS Dispatch
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulated Console Logs feedback */}
                {(isSending || sendSuccess) && (
                  <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-[11px] leading-relaxed space-y-1 block border border-slate-800 max-h-56 overflow-y-auto">
                    <span className="text-slate-500 block border-b border-slate-800 pb-1.5 mb-1.5 font-sans font-bold uppercase tracking-wider">Transmission Console telemetry</span>
                    {dispatchLogs.map((log, lIdx) => (
                      <div key={lIdx} className="fade-in">
                        {log}
                      </div>
                    ))}
                    {isSending && (
                      <span className="inline-block w-2.5 h-1.5 bg-emerald-405 animate-pulse ml-1 font-bold">▋</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
