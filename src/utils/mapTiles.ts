/**
 * Shared Leaflet tile configuration.
 *
 * Previously each of the three map instances (full map, drawer route map,
 * settings mini-map) hardcoded its own ArcGIS URL and disabled attribution.
 * Esri's terms require attribution, so it is included here and rendered.
 */

export type MapStyleId = 'street' | 'clean' | 'dark' | 'satellite';

export interface TileConfig {
  url: string;
  maxZoom: number;
  name: string;
  attribution: string;
}

const ESRI_ATTRIBUTION =
  '<a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors';

export const TILE_CONFIGS: Record<MapStyleId, TileConfig> = {
  street: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    name: 'Street',
    attribution: ESRI_ATTRIBUTION,
  },
  clean: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    name: 'Minimal',
    attribution: ESRI_ATTRIBUTION,
  },
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    name: 'Dark',
    attribution: ESRI_ATTRIBUTION,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 18,
    name: 'Satellite',
    attribution: `${ESRI_ATTRIBUTION}, Maxar, Earthstar Geographics`,
  },
};

export const MAP_STYLE_IDS = Object.keys(TILE_CONFIGS) as MapStyleId[];

/** Tile style that matches the active UI theme, used as the default. */
export const defaultStyleForTheme = (theme: 'light' | 'dark'): MapStyleId =>
  theme === 'dark' ? 'dark' : 'street';

/** Inline map style for the small embedded route/preview maps. */
export const previewStyleForTheme = (theme: 'light' | 'dark'): MapStyleId =>
  theme === 'dark' ? 'dark' : 'clean';
