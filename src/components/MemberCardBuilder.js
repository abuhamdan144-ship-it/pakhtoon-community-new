import opcLogoUrl from '../assets/images/pukhtoon_community_logo_1785867933974.jpg';

function imageFromDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export async function buildCardFront(member) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 756;
  const context = canvas.getContext('2d');

  // Background
  const bgGradient = context.createRadialGradient(600, 378, 100, 600, 378, 800);
  bgGradient.addColorStop(0, '#ffffff');
  bgGradient.addColorStop(1, '#f5f5f5');
  context.fillStyle = bgGradient;
  context.fillRect(0, 0, 1200, 756);

  // Background texture/noise (optional shine look)
  context.fillStyle = 'rgba(212, 175, 55, 0.03)';
  context.beginPath();
  context.arc(900, 600, 400, 0, Math.PI * 2);
  context.fill();

  // Top-left green shape
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(550, 0);
  context.bezierCurveTo(400, 200, 150, 350, 0, 500);
  context.closePath();
  context.fillStyle = '#0a3622';
  context.fill();

  context.beginPath();
  context.moveTo(550, 0);
  context.bezierCurveTo(400, 200, 150, 350, 0, 500);
  context.strokeStyle = '#d4af37';
  context.lineWidth = 6;
  context.shadowColor = 'rgba(212, 175, 55, 0.5)';
  context.shadowBlur = 10;
  context.stroke();
  context.shadowBlur = 0; // reset

  // Bottom-right green shape
  context.beginPath();
  context.moveTo(1200, 350);
  context.bezierCurveTo(900, 400, 600, 600, 350, 756);
  context.lineTo(1200, 756);
  context.closePath();
  context.fillStyle = '#0a3622';
  context.fill();

  context.beginPath();
  context.moveTo(1200, 350);
  context.bezierCurveTo(900, 400, 600, 600, 350, 756);
  context.strokeStyle = '#d4af37';
  context.lineWidth = 6;
  context.shadowColor = 'rgba(212, 175, 55, 0.5)';
  context.shadowBlur = 10;
  context.stroke();
  context.shadowBlur = 0;

  // Draw Photo
  const photoX = 100;
  const photoY = 90;
  const photoWidth = 300;
  const photoHeight = 400;
  const photoRadius = 24;

  context.save();
  roundRect(context, photoX, photoY, photoWidth, photoHeight, photoRadius);
  context.clip();
  if (member.photo) {
    try {
      const image = await imageFromDataUrl(member.photo);
      const imageRatio = image.width / image.height;
      const frameRatio = photoWidth / photoHeight;
      let sourceWidth = image.width;
      let sourceHeight = image.height;
      let sourceX = 0;
      let sourceY = 0;
      if (imageRatio > frameRatio) {
        sourceWidth = image.height * frameRatio;
        sourceX = (image.width - sourceWidth) / 2;
      } else {
        sourceHeight = image.width / frameRatio;
        sourceY = (image.height - sourceHeight) / 2;
      }
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, photoX, photoY, photoWidth, photoHeight);
    } catch (_) {
      context.fillStyle = '#0a3622';
      context.fillRect(photoX, photoY, photoWidth, photoHeight);
    }
  } else {
    context.fillStyle = '#0a3622';
    context.fillRect(photoX, photoY, photoWidth, photoHeight);
  }
  context.restore();

  roundRect(context, photoX, photoY, photoWidth, photoHeight, photoRadius);
  context.strokeStyle = '#d4af37';
  context.lineWidth = 6;
  context.stroke();

  // Text under photo
  const cx = photoX + photoWidth / 2;
  context.textAlign = 'center';
  context.fillStyle = '#0a3622';
  context.font = 'bold 36px Arial, sans-serif';
  context.fillText(String(member.name || 'OPC MEMBER').toUpperCase().slice(0, 32), cx, 540);

  context.fillStyle = '#b8860b';
  context.font = 'bold 28px Georgia, serif';
  context.fillText(member.membershipId || 'OPC-MEMBER', cx, 590);

  context.fillStyle = '#333333';
  context.font = '24px Georgia, serif';
  context.fillText('Oman Community Member', cx, 630);

  // Draw Logo and Center content
  const rightCenter = 820;
  try {
    const logoImg = await imageFromDataUrl(opcLogoUrl);
    context.drawImage(logoImg, rightCenter - 160, 60, 320, 320);
  } catch(e) {}

  // OMAN PAKHTOON Text
  context.font = 'bold 55px "Arial Black", Arial, sans-serif';
  const textOman = 'OMAN ';
  const textPak = 'PAKHTOON';
  const omanWidth = context.measureText(textOman).width;
  const pakWidth = context.measureText(textPak).width;
  const totalWidth = omanWidth + pakWidth;
  let startX = rightCenter - totalWidth / 2;

  context.textAlign = 'left';
  context.fillStyle = '#0a3622';
  context.fillText(textOman, startX, 450);
  context.fillStyle = '#e53935';
  context.fillText(textPak, startX + omanWidth, 450);

  context.textAlign = 'center';
  context.fillStyle = '#b8860b';
  context.font = 'bold 26px "Arial Black", Arial, sans-serif';
  let commText = '—  C O M M U N I T Y  —';
  context.fillText(commText, rightCenter, 510);

  // Bottom right Status
  context.fillStyle = '#ffffff';
  context.font = 'bold 32px Arial, sans-serif';
  context.fillText('APPROVED MEMBER', 880, 650);

  context.fillStyle = '#d4af37';
  context.font = '22px Arial, sans-serif';
  context.fillText('— VALID FOR LIFETIME —', 880, 690);

  return canvas;
}

export async function buildCardBack(member) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 756;
  const context = canvas.getContext('2d');

  // Fill background
  context.fillStyle = '#fefefe';
  context.fillRect(0, 0, 1200, 756);

  // Top Banner
  context.fillStyle = '#0a3622';
  context.fillRect(0, 0, 1200, 120);
  context.beginPath();
  context.moveTo(0, 120);
  context.lineTo(1200, 120);
  context.strokeStyle = '#d4af37';
  context.lineWidth = 6;
  context.stroke();

  // Top Banner Text
  context.textAlign = 'center';
  context.fillStyle = '#d4af37';
  context.font = 'bold 26px Arial, sans-serif';
  context.fillText('< ❖ >   STRONGER TOGETHER, BETTER TOMORROW   < ❖ >', 600, 68);

  // Bottom Banner
  context.fillStyle = '#0a3622';
  context.fillRect(0, 636, 1200, 120);
  context.beginPath();
  context.moveTo(0, 636);
  context.lineTo(1200, 636);
  context.strokeStyle = '#d4af37';
  context.lineWidth = 6;
  context.stroke();

  // Bottom Banner Text
  context.textAlign = 'center';
  context.fillStyle = '#d4af37';
  context.font = 'bold 22px Arial, sans-serif';
  context.fillText('< ❖ >   UNITY   •   RESPECT   •   CULTURE   •   SERVICE   < ❖ >', 600, 705);

  // Middle Section
  context.fillStyle = '#0a3622';
  context.font = 'bold 30px Arial, sans-serif';
  context.fillText('— MEMBER BENEFITS —', 600, 200);

  // Icons/Benefits (4 columns)
  const cols = [
    { icon: '🤝', title: 'COMMUNITY', sub: 'NETWORKING' },
    { icon: '❤️', title: 'SOCIAL', sub: 'SUPPORT' },
    { icon: '🎓', title: 'EDUCATIONAL', sub: 'RESOURCES' },
    { icon: '🛡️', title: 'ADVOCACY &', sub: 'WELFARE' }
  ];

  cols.forEach((col, i) => {
    const x = 240 + i * 240;
    context.font = '60px Arial, sans-serif';
    context.fillText(col.icon, x, 320);
    context.font = 'bold 18px Arial, sans-serif';
    context.fillStyle = '#000000';
    context.fillText(col.title, x, 370);
    context.fillText(col.sub, x, 395);
    
    if (i < 3) {
      context.beginPath();
      context.moveTo(x + 120, 260);
      context.lineTo(x + 120, 410);
      context.strokeStyle = '#e0e0e0';
      context.lineWidth = 2;
      context.stroke();
    }
  });

  // Divider horizontal line
  context.beginPath();
  context.moveTo(100, 450);
  context.lineTo(1100, 450);
  context.strokeStyle = '#d4af37';
  context.lineWidth = 2;
  context.stroke();

  // Lower Middle: Contact Info
  context.textAlign = 'left';
  context.font = '22px Arial, sans-serif';
  context.fillStyle = '#000000';
  const startY = 510;
  const gap = 35;
  
  context.fillText('🌐  www.opc-oman.org', 100, startY);
  context.fillText('📧  info@opc-oman.org', 100, startY + gap * 1);
  context.fillText('📍  Muscat, Sultanate of Oman', 100, startY + gap * 2);

  context.font = 'bold 22px Arial, sans-serif';
  context.fillStyle = '#0a3622';
  context.fillText('Helpline Numbers:', 450, startY - 10);
  context.font = 'bold 20px Arial, sans-serif';
  context.fillStyle = '#333333';
  context.fillText('PRES:', 450, startY + gap * 0.7);
  context.fillText('CO-PRES:', 450, startY + gap * 1.5);
  context.fillText('MUSCAT:', 450, startY + gap * 2.3);
  context.fillText('BACHA JEE:', 450, startY + gap * 3.1);

  context.font = '20px Arial, sans-serif';
  context.fillStyle = '#555555';
  context.fillText('+968 96164017', 590, startY + gap * 0.7);
  context.fillText('+968 95079400', 590, startY + gap * 1.5);
  context.fillText('+968 99111870', 590, startY + gap * 2.3);
  context.fillText('+968 96766876', 590, startY + gap * 3.1);

  // QR Code representation
  const qrX = 930;
  const qrY = 475;
  const qrSize = 140;
  context.fillStyle = '#ffffff';
  context.fillRect(qrX, qrY, qrSize, qrSize);
  context.strokeStyle = '#0a3622';
  context.lineWidth = 4;
  context.strokeRect(qrX, qrY, qrSize, qrSize);
  
  context.fillStyle = '#0a3622';
  // Use a seeded random based on membership ID so it's consistent
  let seed = Array.from(member.membershipId || 'OPC').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  for(let i=0; i<6; i++) {
    for(let j=0; j<6; j++) {
      if(random() > 0.4) {
        context.fillRect(qrX + 10 + i*20, qrY + 10 + j*20, 20, 20);
      }
    }
  }
  
  // 3 big squares for QR corners
  const drawCorner = (cx, cy) => {
    context.fillStyle = '#0a3622';
    context.fillRect(cx, cy, 30, 30);
    context.fillStyle = '#ffffff';
    context.fillRect(cx + 5, cy + 5, 20, 20);
    context.fillStyle = '#0a3622';
    context.fillRect(cx + 10, cy + 10, 10, 10);
  };
  drawCorner(qrX + 10, qrY + 10);
  drawCorner(qrX + qrSize - 40, qrY + 10);
  drawCorner(qrX + 10, qrY + qrSize - 40);

  // "SCAN TO VERIFY"
  context.textAlign = 'center';
  context.fillStyle = '#d4af37';
  context.font = 'bold 16px Arial, sans-serif';
  context.fillText('SCAN TO VERIFY', qrX + qrSize/2, qrY + qrSize + 25);

  return canvas;
}

export async function buildCardImageCombined(member) {
  const front = await buildCardFront(member);
  const back = await buildCardBack(member);
  const canvas = document.createElement('canvas');
  canvas.width = 1200 * 2 + 50;
  canvas.height = 756;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f4f7f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add rounded corners shadow for presentation
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  
  // To keep border radius of the card itself if needed, but the original is square corners,
  // the design has rounded corners. Let's round the whole front and back
  const drawRoundedImage = (img, x, y) => {
    ctx.save();
    roundRect(ctx, x, y, 1200, 756, 30);
    ctx.fill(); // fill shadow
    ctx.shadowColor = 'transparent';
    ctx.clip();
    ctx.drawImage(img, x, y);
    ctx.restore();
  };

  drawRoundedImage(front, 0, 0);
  drawRoundedImage(back, 1200 + 50, 0);
  
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', 0.9);
  });
}
