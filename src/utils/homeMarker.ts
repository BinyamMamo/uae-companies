/**
 * The "you are here" marker, shared by the main map and the settings mini-map.
 *
 * Both files used to build their own copy of this HTML, which is how they ended
 * up with different pins. Leaflet takes a raw string for a divIcon, so this is
 * a string rather than a component.
 */
export const HOME_MARKER_SIZE = 34;

/** lucide `map-pin-house`, inlined because Leaflet wants markup, not JSX. */
const MAP_PIN_HOUSE = `
  <path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/>
  <path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/>
  <path d="M18 22v-3"/>
  <circle cx="10" cy="10" r="3"/>
`;

/**
 * A soft radial wash of one hue — light at the centre, deeper at the rim — so
 * the pin reads as a single object against the map rather than a chip with a
 * ring drawn round it.
 */
export function homeMarkerHtml(): string {
  return `
    <div style="position:relative;width:${HOME_MARKER_SIZE}px;height:${HOME_MARKER_SIZE}px;display:flex;align-items:center;justify-content:center">
      <div style="position:absolute;inset:-4px;border-radius:9999px;background:radial-gradient(circle at 50% 50%, rgba(59,130,246,0.30), rgba(59,130,246,0) 70%);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite"></div>
      <div style="width:30px;height:30px;border-radius:9999px;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(37,99,235,0.45);background:radial-gradient(circle at 50% 38%, #60a5fa 0%, #3b82f6 45%, #1d4ed8 100%)">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${MAP_PIN_HOUSE}</svg>
      </div>
    </div>
  `;
}
