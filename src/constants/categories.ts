export const categoryIcons: Record<string, string> = {
  food:          '🍔',
  travel:        '✈️',
  rent:          '🏠',
  utilities:     '💡',
  entertainment: '🎬',
  shopping:      '🛍️',
  health:        '🏥',
  other:         '📦',
};

export const CATEGORIES = Object.keys(categoryIcons) as (keyof typeof categoryIcons)[];

export function getCategoryIcon(category: string, customIcon?: string): string {
  if (category === 'other' && customIcon) return customIcon;
  return categoryIcons[category] ?? '💸';
}
