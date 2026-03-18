export const currencies: Record<string, { symbol: string; name: string }> = {
  NPR: { symbol: '₨', name: 'Nepali Rupee (NPR)' },
  USD: { symbol: '$',  name: 'US Dollar (USD)' },
  INR: { symbol: '₹', name: 'Indian Rupee (INR)' },
  EUR: { symbol: '€', name: 'Euro (EUR)' },
  GBP: { symbol: '£', name: 'British Pound (GBP)' },
};

export const DEFAULT_CURRENCY = 'NPR';
