// DMI Design System color palette

export const DMI_COLORS = {
  primary: '#1d3b64',
  navy: '#003366',
  orange: '#F58030',
  green: '#A7BB54',
  gold: '#f6b800',
  red: '#F15D59',
  teal: '#81CCB5',
  purple: '#6E5990',
  mauve: '#AE576F',
  bg: '#f5f5f5',
  text: '#333333',
  tableAccent: '#2a4d6e',
} as const;

// Color schemes per dashboard section
export const PAGE_COLORS = {
  voorblad: {
    bg: DMI_COLORS.text,
    accent: DMI_COLORS.orange,
    text: '#ffffff',
  },
  introductie: {
    bg: '#ffffff',
    accent: DMI_COLORS.primary,
    text: DMI_COLORS.text,
  },
  trends: {
    bg: '#2D2D2D',
    accent: DMI_COLORS.orange,
    text: '#ffffff',
    chartColors: [DMI_COLORS.orange, DMI_COLORS.primary, DMI_COLORS.teal],
  },
  zendingen: {
    bg: DMI_COLORS.primary,
    accent: DMI_COLORS.teal,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.teal, DMI_COLORS.gold, DMI_COLORS.mauve],
  },
  nationaleZendingen: {
    bg: DMI_COLORS.primary,
    accent: DMI_COLORS.teal,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.teal, DMI_COLORS.gold],
  },
  internationaleZendingen: {
    bg: '#5C6B2F',
    accent: DMI_COLORS.green,
    text: '#ffffff',
    chartColors: [DMI_COLORS.green, DMI_COLORS.primary, DMI_COLORS.teal, DMI_COLORS.gold],
  },
  nationaleDeelritten: {
    bg: DMI_COLORS.primary,
    accent: DMI_COLORS.teal,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.teal, DMI_COLORS.gold, DMI_COLORS.mauve],
  },
  internationaleDeelritten: {
    bg: DMI_COLORS.mauve,
    accent: '#C46B82',
    text: '#ffffff',
    chartColors: [DMI_COLORS.mauve, DMI_COLORS.primary, DMI_COLORS.teal, DMI_COLORS.gold],
  },
  routekaart: {
    bg: '#ffffff',
    accent: DMI_COLORS.orange,
    text: DMI_COLORS.text,
  },
  externeLinks: {
    bg: '#ffffff',
    accent: DMI_COLORS.purple,
    text: '#ffffff',
  },
  anprOverzicht: {
    bg: DMI_COLORS.primary,
    accent: DMI_COLORS.orange,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.orange, DMI_COLORS.teal, DMI_COLORS.mauve],
  },
  anprEmissie: {
    bg: DMI_COLORS.primary,
    accent: DMI_COLORS.teal,
    text: '#ffffff',
    chartColors: [DMI_COLORS.orange, DMI_COLORS.green, DMI_COLORS.red, DMI_COLORS.primary],
  },
  anprBedrijven: {
    bg: '#2a4d6e',
    accent: DMI_COLORS.orange,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.orange, DMI_COLORS.teal, DMI_COLORS.green, DMI_COLORS.mauve],
  },
  anprBezoekers: {
    bg: DMI_COLORS.primary,
    accent: DMI_COLORS.green,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.orange, DMI_COLORS.teal, DMI_COLORS.green],
  },
  anprTijdpatronen: {
    bg: '#2a4d6e',
    accent: DMI_COLORS.teal,
    text: '#ffffff',
    chartColors: [DMI_COLORS.primary, DMI_COLORS.orange, DMI_COLORS.teal, DMI_COLORS.green, DMI_COLORS.mauve],
  },
} as const;

// Chart color sequences for multi-series charts
export const CHART_SERIES_COLORS = [
  DMI_COLORS.primary,
  DMI_COLORS.orange,
  DMI_COLORS.green,
  DMI_COLORS.teal,
  DMI_COLORS.gold,
  DMI_COLORS.mauve,
  DMI_COLORS.purple,
  DMI_COLORS.red,
];

// Sequential color scale for choropleth maps (light to dark)
export const CHOROPLETH_TEAL = [
  '#e8f5f0',
  '#b8e0d1',
  '#81CCB5',
  '#5ab89a',
  '#37a07f',
  '#1a8565',
  '#006a4c',
];

export const CHOROPLETH_MAUVE = [
  '#f5e8ed',
  '#e0b8c5',
  '#cc8a9f',
  '#AE576F',
  '#934561',
  '#783553',
  '#5d2545',
];

// Route map heat scale (yellow to dark red)
export const ROUTE_HEAT_COLORS = [
  '#FFF3B0',
  '#FFD166',
  '#F58030',
  '#E85D2D',
  '#D43D1A',
  '#A82010',
  '#7A1008',
];

// Year colors for multi-year charts
export const YEAR_COLORS: Record<number, string> = {
  2021: '#81CCB5',
  2022: '#F58030',
  2023: '#1d3b64',
  2024: '#AE576F',
  2025: '#A7BB54',
};
