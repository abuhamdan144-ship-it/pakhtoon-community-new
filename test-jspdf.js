import { jsPDF } from 'jspdf';
try {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1200, 756], compress: true });
  console.log('Success');
} catch (e) {
  console.log('Error:', e);
}
