import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { Panel } from './primitives';
import { useHudTheme } from './hudTheme';
import { getBridge } from './pcBridge';

declare global {
  interface Window {
    google?: any;
    __vicMapsCallback?: () => void;
  }
}

const SCRIPT_ID = 'vic-google-maps-js';
const GEO_FALLBACK_MESSAGE = 'GPS unavailable. Routing still works from the typed destination.';

function loadGoogleMaps(apiKey: string): Promise<typeof window.google> {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (document.getElementById(SCRIPT_ID)) {
    return new Promise((resolve, reject) => {
      const interval = window.setInterval(() => {
        if (window.google?.maps) { window.clearInterval(interval); resolve(window.google); }
      }, 100);
      window.setTimeout(() => { window.clearInterval(interval); reject(new Error('Maps load timeout')); }, 10000);
    });
  }
  return new Promise((resolve, reject) => {
    window.__vicMapsCallback = () => resolve(window.google);
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&loading=async&callback=__vicMapsCallback`;
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });
}

interface RouteSummary { distance: string; duration: string; summary: string }

export function NavScreen() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { palette } = useHudTheme();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [searching, setSearching] = useState(false);
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [turnByTurn, setTurnByTurn] = useState<{ instruction: string; distance: string; icon: string } | null>(null);
  const [eta, setEta] = useState<{ minutes: number; arrival: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState('Awaiting browser geolocation.');

  useEffect(() => {
    if (!apiKey) {
      setError('VITE_GOOGLE_MAPS_API_KEY is not set. Add it to .env and restart.');
      return;
    }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.6062, lng: -122.3321 }, // Default: Seattle
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: tacticalMapStyle(palette.primary, palette.accent),
        });
        mapInstance.current = map;
        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: { strokeColor: palette.accent, strokeWeight: 5, strokeOpacity: 0.85 },
        });

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setOrigin(here);
              setGeoStatus('GPS origin locked.');
              map.setCenter(here);
              map.setZoom(14);
              new google.maps.Marker({
                position: here,
                map,
                title: 'You are here',
                icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: palette.primary, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 },
              });
            },
            () => { if (!cancelled) setGeoStatus(GEO_FALLBACK_MESSAGE); },
            { enableHighAccuracy: true, timeout: 8000 },
          );
        } else {
          setGeoStatus(GEO_FALLBACK_MESSAGE);
        }
      })
      .catch((err) => setError(err.message));

    return () => { cancelled = true; };
  }, [apiKey, palette.primary, palette.accent]);

  const startNavigation = async () => {
    if (!directionsService.current || !destination.trim()) return;
    setSearching(true);
    setRoute(null);
    try {
      const result = await directionsService.current.route({
        origin: origin || destination,
        destination,
        travelMode: 'DRIVING',
      });
      directionsRenderer.current.setDirections(result);
      const leg = result.routes?.[0]?.legs?.[0];
      if (leg) {
        setRoute({
          distance: leg.distance.text,
          duration: leg.duration.text,
          summary: result.routes[0].summary || `${leg.start_address} → ${leg.end_address}`,
        });

        // Simulate turn-by-turn (in real app this would come from live guidance)
        const steps = leg.steps || [];
        if (steps.length > 0) {
          const firstStep = steps[0];
          setTurnByTurn({
            instruction: firstStep.instructions?.replace(/<[^>]+>/g, '') || 'Proceed to destination',
            distance: firstStep.distance?.text || '',
            icon: 'arrow-up',
          });
          setEta({
            minutes: Math.round(leg.duration.value / 60),
            arrival: new Date(Date.now() + leg.duration.value * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Routing failed: ${message}`);
    } finally {
      setSearching(false);
    }
  };

  const openInGoogleMaps = () => {
    const bridge = getBridge();
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    if (bridge) bridge.apps.openUrl(url);
    else window.open(url, '_blank');
  };

  return (
    <div className="screen-grid nav-grid">
      <div className="screen-column nav-side">
        <Panel title="Destination" flag="GOOGLE">
          <form
            className="nav-search"
            onSubmit={(event) => { event.preventDefault(); startNavigation(); }}
          >
            <Icon name="search" width={14} height={14} />
            <input
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="Address, place, or coordinates"
              autoComplete="off"
            />
            <button className="hud-action-button" type="submit" disabled={searching || !destination.trim()}>
              {searching ? 'ROUTING...' : 'GO'}
            </button>
          </form>
          <div className="button-row">
            <button className="hud-ghost-button" type="button" onClick={openInGoogleMaps} disabled={!destination}>
              OPEN IN BROWSER
            </button>
            <button className="hud-ghost-button" type="button" onClick={() => setDestination('')}>CLEAR</button>
          </div>
        </Panel>

        <Panel title="GUIDANCE" flag={route ? 'LIVE' : 'IDLE'} className="stretch-panel">
          {route && turnByTurn ? (
            <div className="nav-guidance">
              <div className="nav-next-turn">
                <Icon name={turnByTurn.icon as any} width={28} height={28} />
                <div>
                  <div className="nav-instruction">{turnByTurn.instruction}</div>
                  <div className="nav-distance">{turnByTurn.distance}</div>
                </div>
              </div>
              {eta && (
                <div className="nav-eta">
                  <strong>ETA {eta.arrival}</strong> • {eta.minutes} min remaining
                </div>
              )}
            </div>
          ) : route ? (
            <div className="mono-readout">
              <div className="ok-text"><strong>{route.duration}</strong></div>
              <div>DIST / {route.distance}</div>
              <div>{route.summary}</div>
            </div>
          ) : (
            <div className="micro-label">Enter a destination to begin turn-by-turn guidance.</div>
          )}
        </Panel>

        <div className="nav-controls">
          <button 
            className={`hud-action-button ${trafficEnabled ? 'active' : ''}`} 
            onClick={() => setTrafficEnabled(!trafficEnabled)}
          >
            {trafficEnabled ? 'TRAFFIC ON' : 'TRAFFIC OFF'}
          </button>
          <button className="hud-ghost-button" onClick={() => {
            if (directionsRenderer.current) directionsRenderer.current.setMap(null);
            setRoute(null); setTurnByTurn(null); setEta(null);
          }}>
            END ROUTE
          </button>
        </div>

        <Panel title="Origin" flag={origin ? 'GPS' : 'PENDING'}>
          {origin ? (
            <div className="mono-readout">
              <div>LAT / {origin.lat.toFixed(5)}</div>
              <div>LNG / {origin.lng.toFixed(5)}</div>
            </div>
          ) : (
            <div className="micro-label">{geoStatus}</div>
          )}
        </Panel>
      </div>

      <div className="screen-column nav-map-column">
        <Panel className="nav-map-panel">
          {error ? (
            <div className="nav-map-fallback">
              <Icon name="map" width={32} height={32} />
              <strong>MAP UNAVAILABLE</strong>
              <span>{error}</span>
              <em>See README for setup. Falling back to URL deep-link via OPEN IN BROWSER.</em>
            </div>
          ) : (
            <div ref={mapRef} className="nav-map-canvas" />
          )}
        </Panel>
      </div>
    </div>
  );
}

function tacticalMapStyle(primary: string, accent: string) {
  return [
    { elementType: 'geometry', stylers: [{ color: '#0a1218' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#05090d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: primary }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2935' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0d1820' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: accent }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020a14' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: primary }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1f3242' }] },
  ];
}

export default NavScreen;
