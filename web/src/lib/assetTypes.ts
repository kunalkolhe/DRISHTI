/**
 * Catalogue of public asset types DRISHTI tracks.
 *
 * Each entry knows which department owns it and how often it needs a
 * preventive check-up (days). Pure data — safe to import anywhere.
 * `category` on an Asset is now a free string, so workers can also type a
 * type that isn't listed here; `getAssetType()` falls back gracefully.
 */

export type AssetTypeConfig = {
  value: string;
  label: string;
  department: string;
  /** preventive-maintenance cycle, in days */
  maintenanceDays: number;
};

export const ASSET_TYPES: AssetTypeConfig[] = [
  { value: "STREETLIGHT", label: "Streetlight", department: "Electrical / Street Lighting Department", maintenanceDays: 180 },
  { value: "SOLAR_LIGHT", label: "Solar street light", department: "Electrical / Renewable Energy Cell", maintenanceDays: 180 },
  { value: "HIGH_MAST_LIGHT", label: "High-mast light", department: "Electrical / Street Lighting Department", maintenanceDays: 120 },
  { value: "TRAFFIC_SIGNAL", label: "Traffic signal", department: "Electrical / Traffic Department", maintenanceDays: 90 },
  { value: "CCTV", label: "CCTV camera", department: "Smart City / City Surveillance Cell", maintenanceDays: 90 },
  { value: "PA_SYSTEM", label: "Public address / siren", department: "Disaster Management Cell", maintenanceDays: 120 },

  { value: "HANDPUMP", label: "Handpump", department: "Water Supply Department", maintenanceDays: 90 },
  { value: "BOREWELL", label: "Borewell / tubewell", department: "Water Supply Department", maintenanceDays: 90 },
  { value: "WATER_TANK", label: "Overhead water tank (ESR)", department: "Water Supply Department", maintenanceDays: 180 },
  { value: "WATER_ATM", label: "Water ATM / RO booth", department: "Water Supply Department", maintenanceDays: 60 },
  { value: "PUBLIC_TAP", label: "Public stand-post tap", department: "Water Supply Department", maintenanceDays: 90 },

  { value: "DRAINAGE", label: "Drain / stormwater line", department: "Sewerage & Drainage Department", maintenanceDays: 60 },
  { value: "MANHOLE", label: "Manhole / chamber cover", department: "Sewerage & Drainage Department", maintenanceDays: 90 },
  { value: "CULVERT", label: "Culvert", department: "Public Works Department", maintenanceDays: 365 },

  { value: "ROAD", label: "Road / carriageway", department: "Public Works Department", maintenanceDays: 365 },
  { value: "FOOTPATH", label: "Footpath", department: "Public Works Department", maintenanceDays: 365 },
  { value: "SPEED_BREAKER", label: "Speed breaker / table-top", department: "Public Works Department", maintenanceDays: 365 },
  { value: "BUS_SHELTER", label: "Bus shelter", department: "Urban Transport / Public Works Department", maintenanceDays: 120 },

  { value: "OPEN_GYM", label: "Open-gym unit", department: "Parks & Gardens Department", maintenanceDays: 30 },
  { value: "PLAY_EQUIPMENT", label: "Playground equipment", department: "Parks & Gardens Department", maintenanceDays: 30 },
  { value: "PARK_BENCH", label: "Park bench / seating", department: "Parks & Gardens Department", maintenanceDays: 90 },
  { value: "PARK_LIGHT", label: "Garden / park light", department: "Parks & Gardens Department", maintenanceDays: 120 },

  { value: "PUBLIC_TOILET", label: "Public toilet", department: "Sanitation Department", maintenanceDays: 7 },
  { value: "COMMUNITY_BIN", label: "Community garbage bin", department: "Solid Waste Management Department", maintenanceDays: 15 },
  { value: "URINAL", label: "Public urinal", department: "Sanitation Department", maintenanceDays: 7 },

  { value: "COMMUNITY_HALL", label: "Community hall / hall shed", department: "Estate / Building Department", maintenanceDays: 180 },
  { value: "NOTICE_BOARD", label: "Notice board / hoarding frame", department: "Ward Office", maintenanceDays: 180 },
];

const BY_VALUE = new Map(ASSET_TYPES.map((t) => [t.value, t]));

const DEFAULT: AssetTypeConfig = {
  value: "OTHER",
  label: "Other public asset",
  department: "Ward Office / General",
  maintenanceDays: 90,
};

/** Prettify an arbitrary stored category string for display. */
export function prettyCategory(value: string | null | undefined): string {
  if (!value) return DEFAULT.label;
  const known = BY_VALUE.get(value);
  if (known) return known.label;
  // custom string like "cattle_trough" or "Cattle Trough"
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Config for a category value; falls back to sensible defaults for custom ones. */
export function getAssetType(value: string | null | undefined): AssetTypeConfig {
  if (!value) return DEFAULT;
  return BY_VALUE.get(value) ?? { ...DEFAULT, value, label: prettyCategory(value) };
}

export function maintenanceDaysFor(value: string | null | undefined): number {
  return getAssetType(value).maintenanceDays;
}

export function departmentFor(value: string | null | undefined): string {
  return getAssetType(value).department;
}

/* ---- AMC / warranty durations for the Add-Asset dropdown ---- */

export type WarrantyOption = { value: string; label: string; days: number };

export const WARRANTY_OPTIONS: WarrantyOption[] = [
  { value: "none", label: "No warranty / AMC", days: 0 },
  { value: "7", label: "7 days", days: 7 },
  { value: "15", label: "15 days", days: 15 },
  { value: "30", label: "1 month", days: 30 },
  { value: "90", label: "3 months", days: 90 },
  { value: "180", label: "6 months", days: 180 },
  { value: "270", label: "9 months", days: 270 },
  { value: "365", label: "1 year", days: 365 },
];

export function warrantyOptionByValue(value: string | null | undefined): WarrantyOption | null {
  return WARRANTY_OPTIONS.find((o) => o.value === value) ?? null;
}
