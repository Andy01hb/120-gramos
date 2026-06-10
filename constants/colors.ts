// Dark theme — admin panel
export const Colors = {
  primary: '#FFD700',
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceAlt: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#888888',
  error: '#ff5555',
  success: '#4caf50',
  border: '#2a2a2a',
  overlay: 'rgba(0,0,0,0.6)',
} as const;

// Dark amber theme — customer-facing screens
export const CColors = {
  primary: '#C8960A',           // Warm amber-gold
  background: '#0a0a0a',        // Black canvas
  surface: '#161616',           // Dark card surface
  surfaceAlt: '#1e1e1e',        // Alternate dark surface
  surfaceWarm: '#1A1000',       // Dark warm brown (stand card, subtle accents)
  surfaceMuted: '#1e1e1e',      // Image placeholder background
  text: '#FFFFFF',
  textSecondary: '#888888',
  error: '#ff5555',
  success: '#4caf50',
  border: '#2a2a2a',
  overlay: 'rgba(0,0,0,0.6)',
} as const;
