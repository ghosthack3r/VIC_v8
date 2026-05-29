import { useEffect, useRef, useState } from 'react';
import { getBridge } from '../../pcBridge';

declare global {
  interface Window {
    google?: any;
    __vicMapsCallback?: () => void;
  }
}

const SCRIPT_ID = 'vic-google-maps-js';

// GUIv2 palette defaults (used when HudThemeProvider is not in tree)
const DEFAULT_PRIMARY = '#4fd1c5';
const DEFAULT_ACCENT = '#00ffe0';
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

interface RouteSummary { distance: string; duration: string; summary: string }

export function NavigationMode() {
  const apiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

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
  const [turnByTurn, setTurnByTurn] = useState<{ instruction: string; distance: string } | null>(null);
  const [eta, setEta] = useState<{ minutes: number; arrival: string } | null>(null);
  const [geoStatus, setGeoStatus] = useState('Awaiting browser geolocation.');

  useEffect(() => {
    if (!apiKey) {
      setError('VITE_GOOGLE_MAPS_API_KEY not set. Add it to your .env file and restart the dev server.');
      return;
    }
    let cancelled = false;
    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 47.6062, lng: -122.3321 },
          zoom: 12,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'greedy',
          styles: tacticalMapStyle(DEFAULT_PRIMARY, DEFAULT_ACCENT),
        });
        mapInstance.current = map;
        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: DEFAULT_ACCENT,
            strokeWeight: 5,
            strokeOpacity: 0.85,
          },
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
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: DEFAULT_PRIMARY,
                  fillOpacity: 1,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  const startNavigation = async () => {
    if (!directionsService.current || !destination.trim()) return;
    setSearching(true);
    setRoute(null);
    try {
      const result = await directionsService.current.route({
        origin: origin ?? destination,
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
        const steps = leg.steps || [];
        if (steps.length > 0) {
          const first = steps[0];
          setTurnByTurn({
            instruction: first.instructions?.replace(/<[^>]+>/g, '') || 'Proceed to destination',
            distance: first.distance?.text || '',
          });
          setEta({
            minutes: Math.round(leg.duration.value / 60),
            arrival: new Date(Date.now() + leg.duration.value * 1000).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit',
            }),
          });
        }
      }
    } catch (err) {
      setError(`Routing failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSearching(false);
    }
  };

  const openInGoogleMaps = () => {
    if (!destination) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    const bridge = getBridge();
    if (bridge) (bridge as any).apps?.openUrl?.(url);
    else window.open(url, '_blank');
  };

  const endRoute = () => {
    if (directionsRenderer.current) directionsRenderer.current.setMap(null);
    setRoute(null);
    setTurnByTurn(null);
    setEta(null);
  };

  return (
    <div className="w-full h-full flex gap-4 overflow-hidden">

      {/* ── Left Panel ── */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3 h-full overflow-y-auto">

        {/* Destination search */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3 text-[10px] tracking-widest text-vic-muted uppercase font-mono">
            <span className="w-[3px] h-[11px] bg-vic-accent inline-block flex-shrink-0" style={{ boxShadow: '0 0 6px #4fd1c5' }} />
            Destination
            <span className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
            <span className="text-[9px]">GOOGLE</span>
          </div>

          <form
            className="flex items-center gap-2 px-3 py-2 border border-white/10 bg-black/30 mb-2"
            onSubmit={(e) => { e.preventDefault(); startNavigation(); }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-vic-muted flex-shrink-0 opacity-60">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Address, place, or coordinates"
              autoComplete="off"
              className="flex-1 bg-transparent border-0 outline-none text-slate-200 text-sm py-1 placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={searching || !destination.trim()}
              className="px-3 py-1 border border-teal-500/50 bg-teal-500/10 text-teal-400 text-[10px] tracking-widest font-mono disabled:opacity-30 hover:-translate-y-px transition-transform"
            >
              {searching ? '...' : 'GO'}
            </button>
          </form>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={openInGoogleMaps}
              disabled={!destination}
              className="flex-1 px-2 py-1 border border-white/10 bg-transparent text-slate-400 text-[9px] tracking-wider font-mono disabled:opacity-30 hover:-translate-y-px transition-transform"
            >
              OPEN IN BROWSER
            </button>
            <button
              type="button"
              onClick={() => setDestination('')}
              className="px-2 py-1 border border-white/10 bg-transparent text-slate-400 text-[9px] tracking-wider font-mono hover:-translate-y-px transition-transform"
            >
              CLEAR
            </button>
          </div>
        </div>

        {/* Guidance */}
        <div className="glass-panel rounded-xl p-4 flex-1">
          <div className="flex items-center gap-2 mb-3 text-[10px] tracking-widest text-vic-muted uppercase font-mono">
            <span className="w-[3px] h-[11px] bg-vic-accent inline-block flex-shrink-0" style={{ boxShadow: '0 0 6px #4fd1c5' }} />
            Guidance
            <span className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
            <span className={`text-[9px] ${route ? 'text-teal-400' : 'text-slate-600'}`}>{route ? 'LIVE' : 'IDLE'}</span>
          </div>

          {route && turnByTurn ? (
            <div>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 flex-shrink-0 border border-teal-500/50 bg-teal-500/10 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-teal-400 -rotate-45">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-white font-semibold text-sm leading-snug">{turnByTurn.instruction}</div>
                  <div className="text-teal-400/70 text-[10px] mt-1 font-mono tracking-wide">{turnByTurn.distance}</div>
                </div>
              </div>
              {eta && (
                <div className="text-[11px] text-teal-400 pt-2 border-t border-white/10 font-mono tracking-wide">
                  <strong>ETA {eta.arrival}</strong> · {eta.minutes} min
                </div>
              )}
            </div>
          ) : route ? (
            <div className="font-mono text-[11px] space-y-1 tracking-wide">
              <div className="text-teal-400 font-semibold">{route.duration}</div>
              <div className="text-slate-400">DIST / {route.distance}</div>
              <div className="text-slate-500 text-[10px]">{route.summary}</div>
            </div>
          ) : (
            <div className="text-slate-600 text-[9px] font-mono tracking-widest uppercase">
              Enter a destination above to begin routing.
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setTrafficEnabled((t) => !t)}
            className={`flex-1 px-2 py-2 border text-[9px] tracking-widest font-mono transition-all hover:-translate-y-px ${
              trafficEnabled
                ? 'border-teal-500/50 bg-teal-500/10 text-teal-400'
                : 'border-white/10 bg-transparent text-slate-500'
            }`}
          >
            {trafficEnabled ? 'TRAFFIC ON' : 'TRAFFIC OFF'}
          </button>
          <button
            onClick={endRoute}
            className="flex-1 px-2 py-2 border border-white/10 bg-transparent text-slate-500 text-[9px] tracking-widest font-mono hover:-translate-y-px transition-transform"
          >
            END ROUTE
          </button>
        </div>

        {/* Origin GPS */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2 text-[10px] tracking-widest text-vic-muted uppercase font-mono">
            <span className="w-[3px] h-[11px] bg-vic-accent inline-block flex-shrink-0" style={{ boxShadow: '0 0 6px #4fd1c5' }} />
            Origin
            <span className="flex-1 h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
            <span className={`text-[9px] ${origin ? 'text-teal-400' : 'text-slate-600'}`}>{origin ? 'GPS' : 'PENDING'}</span>
          </div>
          {origin ? (
            <div className="font-mono text-[11px] tracking-wide space-y-1 text-slate-300">
              <div>LAT / {origin.lat.toFixed(5)}</div>
              <div>LNG / {origin.lng.toFixed(5)}</div>
            </div>
          ) : (
            <div className="text-slate-600 text-[9px] font-mono tracking-widest uppercase">
              {geoStatus}
            </div>
          )}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="flex-1 relative overflow-hidden rounded-xl border border-white/5 bg-[#0a1218]">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            <strong className="text-yellow-400 font-mono tracking-widest text-sm">MAP UNAVAILABLE</strong>
            <span className="text-slate-400 text-sm max-w-xs">{error}</span>
            <em className="text-slate-600 text-[10px] font-mono">See README for VITE_GOOGLE_MAPS_API_KEY setup.</em>
          </div>
        ) : (
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
        )}

        {/* Custom zoom controls (replaces Google default) */}
        {!error && (
          <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
            <button
              onClick={() => mapInstance.current?.setZoom((mapInstance.current.getZoom() ?? 14) + 1)}
              className="w-8 h-8 border border-teal-500/40 bg-black/70 backdrop-blur text-teal-400 text-xl font-mono flex items-center justify-center hover:bg-teal-500/20 transition-colors"
            >+</button>
            <button
              onClick={() => mapInstance.current?.setZoom((mapInstance.current.getZoom() ?? 14) - 1)}
              className="w-8 h-8 border border-teal-500/40 bg-black/70 backdrop-blur text-teal-400 text-xl font-mono flex items-center justify-center hover:bg-teal-500/20 transition-colors"
            >−</button>
          </div>
        )}

        {/* Tactical corner ticks overlay */}
        <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-teal-500/40 pointer-events-none" />
        <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-teal-500/40 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-teal-500/40 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-teal-500/40 pointer-events-none" />

        {/* Route summary overlay */}
        {route && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 border border-teal-500/40 bg-black/80 backdrop-blur font-mono text-[11px] tracking-wide text-teal-300 flex gap-4">
            <span>{route.duration}</span>
            <span className="text-slate-500">·</span>
            <span>{route.distance}</span>
          </div>
        )}
      </div>
    </div>
  );
}
