import { PalettePreset, PaletteGroup, PaletteColor } from '../types';

export const hexToRgb = (hex: string): { r: number; g: number; b: number; a: number } => {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('') + 'ff';
  } else if (clean.length === 6) {
    clean = clean + 'ff';
  } else if (clean.length === 4) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
  }
  const intVal = parseInt(clean, 16);
  if (isNaN(intVal)) return { r: 0, g: 0, b: 0, a: 255 };
  return {
    r: (intVal >> 24) & 255,
    g: (intVal >> 16) & 255,
    b: (intVal >> 8) & 255,
    a: intVal & 255
  };
};

export const rgbToHex = (r: number, g: number, b: number, a: number = 255): string => {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  if (a < 255) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (h % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x; }
  else if (hp >= 1 && hp < 2) { r1 = x; g1 = c; }
  else if (hp >= 2 && hp < 3) { g1 = c; b1 = x; }
  else if (hp >= 3 && hp < 4) { g1 = x; b1 = c; }
  else if (hp >= 4 && hp < 5) { r1 = x; b1 = c; }
  else if (hp >= 5 && hp < 6) { r1 = c; b1 = x; }
  const m = l - c / 2;
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255)
  };
};

export const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }
  return { h, s, l };
};

export const hslToHex = (h: number, s: number, l: number): string => {
  const { r, g, b } = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
};

export const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsl(r, g, b);
};

/**
 * Authentic 99-color Palette Generator from Palette Spray Studio:
 * 9 grayscale swatches + 10 Hue Families (3x3 grid each: saturation L->R, lightness T->B)
 */
export const generateDefaultPaletteColors = (): { colors: PaletteColor[]; nextId: number } => {
  const list: PaletteColor[] = [];
  let cid = 1;

  // 9 grayscale swatches (white to black)
  const grays = [
    '#ffffff', '#e0e0e0', '#c0c0c0',
    '#a0a0a0', '#808080', '#606060',
    '#404040', '#202020', '#000000'
  ];
  grays.forEach(hex => list.push({ id: cid++, hex }));

  // 10 Hue Families (3x3 grid per hue)
  const hues = [
    { name: 'Red', h: 0 },
    { name: 'Orange', h: 30 },
    { name: 'Yellow', h: 55, lSteps: [0.80, 0.60, 0.40] },
    { name: 'Lime', h: 85 },
    { name: 'Green', h: 130 },
    { name: 'Teal', h: 175 },
    { name: 'Blue', h: 215 },
    { name: 'Purple', h: 265 },
    { name: 'Magenta', h: 315 },
    { name: 'Brown', h: 25, sSteps: [0.30, 0.50, 0.75], lSteps: [0.65, 0.42, 0.22] }
  ];

  const sDefault = [0.30, 0.65, 0.95];
  const lDefault = [0.75, 0.50, 0.25];

  hues.forEach(hueObj => {
    const sSteps = hueObj.sSteps || sDefault;
    const lSteps = hueObj.lSteps || lDefault;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const hex = hslToHex(hueObj.h, sSteps[c], lSteps[r]);
        list.push({ id: cid++, hex });
      }
    }
  });

  return { colors: list, nextId: cid };
};

export const createDefaultPaletteGroups = (): PaletteGroup[] => {
  const init = generateDefaultPaletteColors();
  return [
    {
      id: 0,
      name: 'Main Palette',
      isMain: true,
      colors: init.colors,
      collapsed: false,
      columns: 9
    }
  ];
};

export const DEFAULT_PALETTES: PalettePreset[] = [
  {
    id: 'spray99',
    name: 'Palette Spray Studio Default (99 Colors)',
    author: 'Palette Spray Studio',
    colors: generateDefaultPaletteColors().colors.map(c => c.hex)
  },
  {
    id: 'pico8',
    name: 'PICO-8 (16 Colors)',
    author: 'Lexaloffle',
    colors: [
      '#000000', '#1D2B53', '#7E2553', '#008751',
      '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436',
      '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ]
  },
  {
    id: 'db32',
    name: 'DawnBringer 32',
    author: 'DawnBringer',
    colors: [
      '#000000', '#222034', '#45283c', '#663931',
      '#8f563b', '#df7126', '#d9a066', '#eec39a',
      '#fbf236', '#99e550', '#6abe30', '#37946e',
      '#4b692f', '#524b24', '#323c39', '#3f3f74',
      '#306082', '#5b6ee1', '#639bff', '#5fcde4',
      '#cbdbfc', '#ffffff', '#9badb7', '#847e87',
      '#696a6a', '#595652', '#76428a', '#ac3232',
      '#d95763', '#d77643', '#63ab3f', '#3a4466'
    ]
  },
  {
    id: 'endesga32',
    name: 'Endesga 32 (EDG 32)',
    author: 'Endesga',
    colors: [
      '#be4a2f', '#d77643', '#ead4aa', '#e4a672',
      '#b86f50', '#733e39', '#3e2731', '#a22633',
      '#e43b44', '#f77622', '#feae34', '#fee761',
      '#63c74d', '#3e8948', '#265c42', '#193c3e',
      '#124e89', '#0099db', '#2ce8f5', '#ffffff',
      '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466',
      '#262b44', '#181425', '#ff0044', '#68386c',
      '#b55088', '#f6757a', '#e8b796', '#c28569'
    ]
  },
  {
    id: 'gameboy',
    name: 'Game Boy Classic (4 Shades)',
    author: 'Nintendo',
    colors: [
      '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
    ]
  },
  {
    id: 'sweetie16',
    name: 'Sweetie 16',
    author: 'GrafxKid',
    colors: [
      '#1a1c2c', '#5d275d', '#b13e53', '#ef7d57',
      '#ffcd75', '#a7f070', '#38b764', '#257179',
      '#29366f', '#3b5dc9', '#41a6f6', '#73eff7',
      '#f4f4f4', '#94b0c2', '#566c86', '#333c57'
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon (16)',
    colors: [
      '#050505', '#160f29', '#241734', '#2e2157',
      '#fd1d53', '#ff007f', '#ff5493', '#ffa4cd',
      '#00f0ff', '#00b8ff', '#0077ff', '#7000ff',
      '#00ff9f', '#fcee0a', '#ffffff', '#7b728e'
    ]
  },
  {
    id: 'nes',
    name: 'NES Classic (16 Essentials)',
    author: 'Nintendo',
    colors: [
      '#000000', '#ffffff', '#fc7460', '#3cbcfc',
      '#0000fc', '#9838f0', '#e40058', '#58f898',
      '#00a800', '#f83800', '#f8a4c0', '#d8f878',
      '#007800', '#f8b800', '#a4e4fc', '#7c7c7c'
    ]
  },
  {
    id: 'monochrome',
    name: 'Monochrome Shading (8)',
    colors: [
      '#000000', '#222222', '#444444', '#666666',
      '#888888', '#aaaaaa', '#cccccc', '#ffffff'
    ]
  }
];

