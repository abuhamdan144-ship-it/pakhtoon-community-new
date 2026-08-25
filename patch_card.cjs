const fs = require('fs');
let code = fs.readFileSync('/app/applet/src/components/MemberCard.jsx', 'utf8');

// 1. Add imports
const imports = `import { buildCardFront, buildCardBack, buildCardImageCombined } from './MemberCardBuilder';\n`;
code = code.replace("import toast from 'react-hot-toast';", "import toast from 'react-hot-toast';\n" + imports);

// 2. Remove imageFromDataUrl and buildCardImage
// They start at line 10 and end at line 124 in the full file... let's use regex
code = code.replace(/const imageFromDataUrl = [\s\S]*?function buildCardImage\(member\) {[\s\S]*?}\n\nexport default function MemberCard\(\)/, 'export default function MemberCard()');

// 3. Update buildCardPdf
const oldBuildCardPdf = `  const buildCardPdf = async () => {
    const imageBlob = await buildCardImage(member);
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 756], compress: true });
    pdf.addImage(dataUrl, 'PNG', 0, 0, 1200, 756);
    return pdf.output('blob');
  };`;

const newBuildCardPdf = `  const buildCardPdf = async () => {
    const frontCanvas = await buildCardFront(member);
    const backCanvas = await buildCardBack(member);
    
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 756], compress: true });
    pdf.addImage(frontCanvas.toDataURL('image/png', 0.9), 'PNG', 0, 0, 1200, 756);
    pdf.addPage([1200, 756], 'landscape');
    pdf.addImage(backCanvas.toDataURL('image/png', 0.9), 'PNG', 0, 0, 1200, 756);
    return pdf.output('blob');
  };`;
code = code.replace(oldBuildCardPdf, newBuildCardPdf);

// 4. Update downloadCardImage
const oldDownloadImage = `  const downloadCardImage = async () => {
    if (!member) return;
    setLoading(true);
    try { downloadBlob(await buildCardImage(member), 'png'); toast.success('Image membership card downloaded.'); }
    catch (error) { toast.error(error?.message || 'Unable to download the card image.'); }
    finally { setLoading(false); }
  };`;

const newDownloadImage = `  const downloadCardImage = async () => {
    if (!member) return;
    setLoading(true);
    try { downloadBlob(await buildCardImageCombined(member), 'png'); toast.success('Image membership card downloaded.'); }
    catch (error) { toast.error(error?.message || 'Unable to download the card image.'); }
    finally { setLoading(false); }
  };`;
code = code.replace(oldDownloadImage, newDownloadImage);

fs.writeFileSync('/app/applet/src/components/MemberCard.jsx', code);
