import L from 'leaflet';

// Fix standard Leaflet default icon paths in bundlers like Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * Creates custom colored SVG markers based on pothole severity and repair status:
 * - Red: High / Critical severity
 * - Orange: Medium severity
 * - Yellow: Low severity
 * - Green: Repaired / Verified
 */
export const createPriorityIcon = (priority = 'low', status = 'submitted', count = 1) => {
  const isRepaired = status === 'repair-completed' || status === 'verified';

  let color = '#EAB308'; // Yellow: Low
  let glowColor = 'rgba(234, 179, 8, 0.4)';
  let isPulsing = false;

  if (isRepaired) {
    color = '#10B981'; // Green: Repaired / Verified
    glowColor = 'rgba(16, 185, 129, 0.4)';
  } else if (priority === 'critical') {
    color = '#EF4444'; // Red: Critical
    glowColor = 'rgba(239, 68, 68, 0.5)';
    isPulsing = true;
  } else if (priority === 'high') {
    color = '#F97316'; // Deep Orange / Red-Orange: High
    glowColor = 'rgba(249, 115, 22, 0.45)';
    isPulsing = true;
  } else if (priority === 'medium') {
    color = '#FF8A00'; // Orange: Medium
    glowColor = 'rgba(255, 138, 0, 0.4)';
  }

  const html = `
    <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
      ${
        isPulsing
          ? `<span style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background: ${color}; opacity: 0.35; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>`
          : ''
      }
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #FFFFFF;
        border: 3px solid ${color};
        box-shadow: 0 3px 12px ${glowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${color};
        font-weight: 800;
        font-size: 11px;
        font-family: inherit;
        transition: transform 0.2s ease;
      ">
        ${isRepaired ? '✓' : count > 1 ? count : '●'}
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

/**
 * Custom Blue GPS Pin for the user's active device location with optional heading pointer
 */
export const createUserPinIcon = (heading = null) => {
  const hasHeading = heading !== null && heading !== undefined && !isNaN(heading);
  const rotation = hasHeading ? heading : 0;

  const html = `
    <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <!-- Pulsating accuracy aura -->
      <span style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(10, 132, 255, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
      
      <!-- Direction Heading Arrow if available -->
      ${
        hasHeading
          ? `<div style="
              position: absolute;
              width: 44px;
              height: 44px;
              transform: rotate(${rotation}deg);
              pointer-events: none;
            ">
              <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                <polygon points="22,2 27,14 17,14" fill="#0A84FF" />
              </svg>
            </div>`
          : ''
      }

      <!-- Center Blue GPS Marker -->
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #0A84FF;
        border: 3px solid #FFFFFF;
        box-shadow: 0 2px 10px rgba(10, 132, 255, 0.6);
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-gps-pin',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

/**
 * Maintenance Crew / Vehicle GPS Marker (distinguished from user device)
 */
export const createCrewPinIcon = (teamName = 'Crew') => {
  const html = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 8px;
        background: #FF8A00;
        border: 2px solid #FFFFFF;
        box-shadow: 0 3px 10px rgba(255, 138, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #FFFFFF;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-crew-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });
};
