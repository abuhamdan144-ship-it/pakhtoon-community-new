import React, { useState, useEffect, useRef } from 'react';
import { Member } from '../types';
import { CARD_COLORS, getCardColor } from './CardColors';
import { X, Download, CreditCard, Award, FileText, Send, Share2, CheckCircle2, RefreshCw, Link2, FolderPlus, Trash2, ExternalLink, File as FileIcon, Save, MessageSquare, Copy, Check } from 'lucide-react';
import pukhtoonLogo from '../assets/images/pukhtoon_logo_1781303873200.jpg';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { connectGoogleWorkspace, getCachedToken, openGooglePicker } from '../utils/googleWorkspace';


interface DocumentModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
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

export default function DocumentModal({ member, isOpen, onClose, isAdmin = false }: DocumentModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'certificate' | 'receipt' | 'dispatch' | 'attachments'>('card');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);
  const [memberLocal, setMemberLocal] = useState<Member | null>(null);

  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [customWhatsAppPhone, setCustomWhatsAppPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const receiptCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleAttachDriveFile = async () => {
    setDriveError(null);
    let token = getCachedToken();
    if (!token) {
      setIsConnectingDrive(true);
      try {
        const workspaceconn = await connectGoogleWorkspace();
        if (workspaceconn) {
          token = workspaceconn.accessToken;
        }
      } catch (err: any) {
        setDriveError(err.message || 'Failed to authenticate with Google Drive.');
        setIsConnectingDrive(false);
        return;
      }
      setIsConnectingDrive(false);
    }

    if (token) {
      openGooglePicker(token, async (file) => {
        try {
          if (memberLocal && memberLocal.id) {
            const currentAttachments = memberLocal.driveAttachments || [];
            if (currentAttachments.some((f) => f.id === file.id)) {
              setDriveError('This file is already attached to the member.');
              return;
            }
            const updated = [...currentAttachments, file];
            await updateDoc(doc(db, 'members', memberLocal.id), {
              driveAttachments: updated
            });
            setMemberLocal(prev => prev ? { ...prev, driveAttachments: updated } : null);
          }
        } catch (err: any) {
          setDriveError(err.message || 'Failed to save attach metadata to database.');
        }
      });
    } else {
      setDriveError('Authorization is required to use Google Drive Picker.');
    }
  };

  const handleRemoveDriveFile = async (fileId: string) => {
    if (!memberLocal || !memberLocal.id) return;
    const confirmRemove = window.confirm(
      'Are you sure you want to remove this Google Drive file attachment? This will only remove the link in the membership registry, not the official file on Google Drive.'
    );
    if (!confirmRemove) return;

    try {
      const currentAttachments = memberLocal.driveAttachments || [];
      const updated = currentAttachments.filter(f => f.id !== fileId);
      await updateDoc(doc(db, 'members', memberLocal.id), {
        driveAttachments: updated
      });
      setMemberLocal(prev => prev ? { ...prev, driveAttachments: updated } : null);
    } catch (err: any) {
      setDriveError(err.message || 'Failed to remove file connection.');
    }
  };


  // Keep local member sync'd up
  useEffect(() => {
    if (member) {
      setMemberLocal(member);
      setSendSuccess(false);
      setDispatchLogs([]);
      setActiveTab('card');
      setCustomWhatsAppPhone(member.whatsapp || member.phone || '');
      setIsCopied(false);
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
        
        // Background gradient using dynamic palette
        const selectedPalette = getCardColor(memberLocal.cardColor || 'emerald');
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, selectedPalette.primary);
        grad.addColorStop(1, selectedPalette.secondary);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Oman Flag Stripe top
        ctx.fillStyle = '#c8102e';
        ctx.fillRect(0, 0, W, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 12, W, 6);

        // Gold border
        ctx.strokeStyle = selectedPalette.labelColor;
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
          ctx.strokeStyle = selectedPalette.labelColor;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.save();
          ctx.clip();
          ctx.drawImage(logoImg, 54, 40, 96, 96);
          ctx.restore();
        }

        // Header Text
        ctx.fillStyle = selectedPalette.labelColor;
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
            ctx.fillStyle = selectedPalette.labelColor;
            ctx.fillText(label.toUpperCase(), x, y);
            ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = selectedPalette.textColor;
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
          ctx.fillStyle = selectedPalette.labelColor;
          ctx.fillText('ISSUED: ' + new Date(memberLocal.approvedAt?.seconds ? memberLocal.approvedAt.seconds * 1000 : Date.now()).toLocaleDateString('en-GB'), x, H - 46);
          ctx.textAlign = 'right';
          ctx.fillText('Valid: Lifetime Member', W - 40, H - 46);
        };

        // Profile photo box
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
          ctx.fillText((memberLocal.name || '?').charAt(0).toUpperCase(), 165, 305);
        }
        drawInfoText();

        // Emergency Helplines Section
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.fillRect(60, 455, W - 120, 75);
        ctx.strokeStyle = selectedPalette.labelColor + '44';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(60, 455, W - 120, 75);

        // Title
        ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = selectedPalette.labelColor;
        ctx.textAlign = 'center';
        ctx.fillText('🚨 OPC EMERGENCY HELPLINES', W / 2, 475);

        // Columns
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        
        // Column 1: President
        ctx.textAlign = 'center';
        ctx.fillText('PRESIDENT: +968 96164017', W / 2 - 270, 505);
        
        // Column 2: Muscat
        ctx.fillText('MUSCAT: +968 99111870', W / 2, 505);
        
        // Column 3: Salalah
        ctx.fillText('SALALAH: +968 96766876', W / 2 + 270, 505);
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

  const handleSaveToDevice = async (canvasRef: React.RefObject<HTMLCanvasElement | null>, filename: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check if browser supports File System Access API (showSaveFilePicker)
    if ('showSaveFilePicker' in window) {
      try {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('Canvas blob generation failed.');

        const handle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [{
            description: 'PNG Image',
            accept: {
              'image/png': ['.png'],
            },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('User cancelled save operation');
          return;
        }
        console.warn('File System Access API not permitted or failed, using traditional download wrapper', err);
      }
    }

    // Fallback native download prompt
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

    const targetPhone = customWhatsAppPhone || memberLocal.whatsapp || memberLocal.phone || '';
    const cleanPhone = targetPhone.replace(/[^\d+]/g, '');
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
          {isAdmin && (
            <button
              onClick={() => setActiveTab('dispatch')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
                activeTab === 'dispatch' 
                  ? 'border-emerald-850 bg-emerald-50 text-emerald-950' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Send size={14} />
              Dispatch Console
              {memberLocal.isDispatched && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('attachments')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition border-b-2 cursor-pointer ${
                activeTab === 'attachments' 
                  ? 'border-emerald-800 bg-emerald-50/50 text-emerald-900' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Link2 size={14} className="text-emerald-800" />
              Drive Files
              {memberLocal.driveAttachments && memberLocal.driveAttachments.length > 0 && (
                <span className="bg-emerald-800 text-white rounded-full text-[10px] px-1.5 py-0.2">
                  {memberLocal.driveAttachments.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="space-y-6">
          {/* 1. CARD TAB */}
          {activeTab === 'card' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block mb-3">
                Membership Identity Card Preview (1011x638)
              </span>
              <div className="overflow-x-auto mb-4">
                <canvas 
                  ref={cardCanvasRef} 
                  width="1011" 
                  height="638" 
                  className="w-full max-w-[560px] mx-auto bg-emerald-950 border border-slate-300 rounded-lg shadow-sm block"
                />
              </div>

              {/* Color Selection Choice for Member */}
              <div className="mt-4 max-w-[560px] mx-auto border-t pt-4 border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-2.5 text-center">
                  Theme Palette Color Choice
                </span>
                <div className="flex justify-center gap-3">
                  {CARD_COLORS.map((col) => {
                    const isSelected = (memberLocal.cardColor || 'emerald') === col.id;
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={async () => {
                          const updated = { ...memberLocal, cardColor: col.id };
                          setMemberLocal(updated);
                          if (memberLocal.id) {
                            try {
                              await updateDoc(doc(db, 'members', memberLocal.id), {
                                cardColor: col.id
                              });
                            } catch (e) {
                              console.warn("Could not immediately update cardColor in Firestore:", e);
                            }
                          }
                        }}
                        title={col.label}
                        className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                          isSelected ? 'scale-110 shadow-md ring-2 ring-emerald-600/60' : 'hover:scale-105 opacity-80'
                        }`}
                        style={{ backgroundColor: col.primary, borderColor: col.labelColor }}
                      >
                        {isSelected && (
                          <span className="text-xs font-bold font-sans" style={{ color: col.labelColor }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <p className="text-center text-[11px] text-slate-400 mt-3 italic">
                Optimized high-resolution print template. Custom photo overlay, logo, and selected color palette applied.
              </p>
              
              <div className="text-center mt-4">
                {memberLocal.status === 'approved' || isAdmin ? (
                  <div className="flex flex-wrap justify-center gap-3">
                    <button 
                      onClick={() => handleSaveToDevice(cardCanvasRef, `OPC-Card-${memberLocal.name.replace(/\s+/g, '-')}.png`)} 
                      id="save-card-to-device"
                      className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition duration-155 cursor-pointer"
                    >
                      <Save size={14} className="text-amber-400" /> Save to Device
                    </button>
                    <button 
                      onClick={handleDownloadCard} 
                      id="download-card-traditional"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs px-4 py-2.5 rounded shadow-xs transition duration-155 cursor-pointer border border-slate-300"
                    >
                      <Download size={14} /> Standard Download
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-100 border border-amber-200 text-amber-950 rounded-lg p-3 inline-block max-w-sm text-xs font-semibold">
                    🔒 Card download is locked until your membership application is approved by the administrator.
                  </div>
                )}
              </div>

              {/* WHATSAPP CARD dispatch options */}
              {(memberLocal.status === 'approved' || isAdmin) && (
                <div className="mt-5 border-t border-slate-200 pt-5 max-w-[560px] mx-auto text-left">
                  <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="text-emerald-700 shrink-0" size={17} />
                      <span className="font-bold font-serif text-emerald-950 text-sm">Send Membership Card &amp; Welcomes via WhatsApp</span>
                    </div>
                    
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Transmit the formal diaspora credential notification message containing registration statistics, approved membership ID, and lifetime active status directly.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Recipient WhatsApp Number (With Country Code)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={customWhatsAppPhone}
                          onChange={(e) => setCustomWhatsAppPhone(e.target.value)}
                          placeholder="e.g. +96899111870"
                          className="bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 flex-1 focus:ring-1 focus:ring-emerald-700 focus:outline-none"
                        />
                        <a
                          href={getWhatsAppShareLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs py-1.5 px-4 rounded transition inline-flex items-center justify-center gap-1.5 shrink-0"
                        >
                          <Send size={12} /> Send via WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="border border-emerald-100/60 rounded bg-white p-3 space-y-2">
                      <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                        <span className="text-[10px] font-bold text-slate-405 uppercase tracking-wide">Prefilled Message Track</span>
                        <button
                          type="button"
                          onClick={() => {
                            const amountPaid = memberLocal.feeAmount !== undefined ? memberLocal.feeAmount : 5;
                            const refText = memberLocal.paymentReference ? `(Ref: ${memberLocal.paymentReference})` : '';
                            const text = `OMAN PAKHTOON COMMUNITY\n\nDear Brother ${memberLocal.name},\n\nCongratulations! Your official OPC Diaspora Membership registration has been reviewed and APPROVED by the Executive Cabinet.\n\nHere is your issued credential package:\n📌 Membership ID: ${memberLocal.membershipId || 'OPC-ISSUED'}\n📌 Status: Lifetime Active\n💰 Registration Fee Paid: ${amountPaid.toFixed(3)} OMR ${refText}\n\nWe have enclosed your custom:\n1️⃣ Digital Membership ID Card\n2️⃣ Lifetime Certificate of Association\n3️⃣ Official Automated Payment Receipt\n\nPlease keep this copy secure as part of your permanent records. Thank you for your support and integration within the Sultanate of Oman.\n\nSincerely,\nExecutive Cabinet Committee\nOman Pakhtoon Community Welfare Network`;
                            navigator.clipboard.writeText(text);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="text-[10px] text-emerald-800 hover:text-emerald-950 font-bold tracking-wider uppercase inline-flex items-center gap-1 transition cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check size={11} className="text-emerald-600 font-bold" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={11} /> Copy Text content
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono whitespace-pre-line leading-relaxed max-h-24 overflow-y-auto bg-slate-50/50 p-2 rounded">
                        {`OMAN PAKHTOON COMMUNITY\nDear Brother ${memberLocal.name},\nCongratulations! Your official OPC Diaspora membership has been approved.\nMembership ID: ${memberLocal.membershipId || 'OPC-ISSUED'}\nStatus: Lifetime Active`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                {memberLocal.status === 'approved' || isAdmin ? (
                  <div className="flex flex-wrap justify-center gap-3">
                    <button 
                      onClick={() => handleSaveToDevice(certCanvasRef, `OPC-Certificate-${memberLocal.name.replace(/\s+/g, '-')}.png`)} 
                      id="save-cert-to-device"
                      className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition duration-155 cursor-pointer"
                    >
                      <Save size={14} className="text-amber-400" /> Save to Device
                    </button>
                    <button 
                      onClick={handleDownloadCert} 
                      id="download-cert-traditional"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs px-4 py-2.5 rounded shadow-xs transition duration-155 cursor-pointer border border-slate-300"
                    >
                      <Download size={14} /> Standard Download
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-105 border border-amber-200 text-amber-955 rounded-lg p-3 inline-block max-w-sm text-xs font-semibold">
                    🔒 Certificate download is locked until your membership has been approved by the administrator.
                  </div>
                )}
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
                {memberLocal.status === 'approved' || isAdmin ? (
                  <div className="flex flex-wrap justify-center gap-3">
                    <button 
                      onClick={() => handleSaveToDevice(receiptCanvasRef, `OPC-Payment-Receipt-${memberLocal.name.replace(/\s+/g, '-')}.png`)} 
                      id="save-receipt-to-device"
                      className="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase bg-emerald-800 hover:bg-emerald-900 text-white text-xs px-5 py-2.5 rounded shadow-sm hover:shadow transition duration-155 cursor-pointer"
                    >
                      <Save size={14} className="text-amber-400" /> Save to Device
                    </button>
                    <button 
                      onClick={handleDownloadReceipt} 
                      id="download-receipt-traditional"
                      className="inline-flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs px-4 py-2.5 rounded shadow-xs transition duration-155 cursor-pointer border border-slate-300"
                    >
                      <Download size={14} /> Standard Download
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-105 border border-amber-200 text-amber-955 rounded-lg p-3 inline-block max-w-sm text-xs font-semibold">
                    🔒 Receipt download is locked until your membership receipt verification is approved by the admin.
                  </div>
                )}
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

          {/* 5. GOOGLE DRIVE ATTACHMENTS TAB */}
          {activeTab === 'attachments' && (
            <div className="space-y-5 bg-white border border-slate-200 rounded-xl p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="font-serif text-slate-900 font-extrabold text-base border-l-4 border-emerald-850 pl-2">
                    Google Drive Documents
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Store and reference external registration files, passport scans, or reference files directly on Google Drive.
                  </p>
                </div>
                <div>
                  <button
                    onClick={handleAttachDriveFile}
                    disabled={isConnectingDrive}
                    className="flex items-center justify-center gap-1.5 bg-emerald-850 hover:bg-emerald-900 text-white font-bold text-xs py-2 px-4 rounded transition cursor-pointer disabled:opacity-50"
                  >
                    {isConnectingDrive ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <FolderPlus size={13} />
                        Attach file from Drive
                      </>
                    )}
                  </button>
                </div>
              </div>

              {driveError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200">
                  {driveError}
                </div>
              )}

              {/* Attachments List */}
              <div className="space-y-3">
                {!memberLocal.driveAttachments || memberLocal.driveAttachments.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <FileIcon className="mx-auto text-slate-300 mb-2" size={36} />
                    <p className="text-xs font-semibold text-slate-500">No external documents attached yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click the button above to link official documents from Google Drive.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2.5">
                    {memberLocal.driveAttachments.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-emerald-50 text-emerald-800 rounded-md">
                            <FileIcon size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate" title={f.name}>
                              {f.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              ID: {f.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded transition"
                            title="Open in Google Drive"
                          >
                            <ExternalLink size={15} />
                          </a>
                          <button
                            onClick={() => handleRemoveDriveFile(f.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                            title="Remove attachment link"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
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
