export interface CardColorPalette {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  textColor: string;
  labelColor: string;
}

export const CARD_COLORS: CardColorPalette[] = [
  { id: 'emerald', label: 'Oman Emerald', primary: '#1b4d3e', secondary: '#0e2e25', textColor: '#ffffff', labelColor: '#d4af37' },
  { id: 'navy', label: 'Royal Navy', primary: '#1e3a8a', secondary: '#0f172a', textColor: '#ffffff', labelColor: '#d4af37' },
  { id: 'crimson', label: 'Crimson Red', primary: '#881337', secondary: '#4c0519', textColor: '#ffffff', labelColor: '#f59e0b' },
  { id: 'charcoal', label: 'Executive Slate', primary: '#334155', secondary: '#0f172a', textColor: '#ffffff', labelColor: '#e2e8f0' },
  { id: 'purple', label: 'Imperial Violet', primary: '#581c87', secondary: '#2e0249', textColor: '#ffffff', labelColor: '#f59e0b' }
];

export function getCardColor(colorId?: string): CardColorPalette {
  return CARD_COLORS.find(c => c.id === colorId) || CARD_COLORS[0];
}
