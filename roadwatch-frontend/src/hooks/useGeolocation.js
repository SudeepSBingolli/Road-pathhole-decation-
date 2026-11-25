import { useState, useEffect, useCallback, useRef } from 'react';

// Default fallback coordinates if geolocation is completely disabled
const DEFAULT_COORDS = { lat: 30.2672, lng: -97.7431 };

export const useGeolocation = (autoFetch = true) => {
  // Check if we previously acquired coordinates in this session
  const getInitialCoords = () => {
    try {
      const saved = sessionStorage.getItem('roadguard_device_coords');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.lat && parsed.lng) return parsed;
      }
    } catch {}
    return DEFAULT_COORDS;
  };

  const [coordinates, setCoordinates] = useState(getInitialCoords);
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [hasAcquired, setHasAcquired] = useState(false);

  const getLocation = useCallback((isManual = false) => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const onPosSuccess = (position) => {
      const newCoords = {
        lat: Number(position.coords.latitude.toFixed(6)),
        lng: Number(position.coords.longitude.toFixed(6)),
      };
      setCoordinates(newCoords);
      setAccuracy(Math.round(position.coords.accuracy || 0));
      setHasAcquired(true);
      setLoading(false);
      setError(null);

      try {
        sessionStorage.setItem('roadguard_device_coords', JSON.stringify(newCoords));
      } catch {}
    };

    const tryStandardAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        onPosSuccess,
        (err) => {
          console.warn('Standard geolocation fallback also failed:', err.message);
          setLoading(false);
          if (isManual) {
            setError(
              err.code === err.PERMISSION_DENIED
                ? 'Location permission denied. Please allow location access in your browser.'
                : 'GPS location unavailable. Using approximate location.'
            );
          }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
      );
    };

    // First attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      onPosSuccess,
      (err) => {
        // If high accuracy times out or is unavailable, silently retry with standard WiFi/network accuracy
        if (err.code === 3 || err.code === 2) {
          tryStandardAccuracy();
        } else {
          setLoading(false);
          if (isManual) {
            setError(
              err.code === err.PERMISSION_DENIED
                ? 'Location access denied in browser settings.'
                : 'Unable to retrieve location.'
            );
          }
        }
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  }, []);

  useEffect(() => {
    if (autoFetch) {
      getLocation(false);
    }
  }, [autoFetch, getLocation]);

  return { coordinates, setCoordinates, accuracy, loading, error, hasAcquired, getLocation };
};
