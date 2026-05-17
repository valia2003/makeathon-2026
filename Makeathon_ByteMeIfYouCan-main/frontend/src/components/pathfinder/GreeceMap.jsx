import { Component, useMemo } from "react";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GREECE_CENTER = [38.45, 23.7];

function markerIcon(selected) {
  return L.divIcon({
    className: "",
    html: `
      <span class="pf-leaflet-marker ${selected ? "is-selected" : ""}">
        <span class="pf-leaflet-marker-glow"></span>
        <span class="pf-leaflet-marker-core"></span>
      </span>
    `,
    iconSize: selected ? [30, 30] : [24, 24],
    iconAnchor: selected ? [15, 15] : [12, 12],
  });
}

function validTrail(trail) {
  return Number.isFinite(Number(trail.coordinates?.lat)) && Number.isFinite(Number(trail.coordinates?.lon));
}

function MapFallback() {
  return (
    <div className="pf-leaflet-fallback">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#00F0FF]">Map loading</div>
      <div className="mt-2 text-sm text-[#A3ADAA]">Trail coordinates will appear here when open data loads.</div>
    </div>
  );
}

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <MapFallback />;
    return this.props.children;
  }
}

export default function GreeceMap({ trails = [], selectedTrailId, onSelectTrail }) {
  const mapTrails = useMemo(() => trails.filter(validTrail), [trails]);
  const selectedTrail = mapTrails.find((trail) => trail.id === selectedTrailId);

  if (!mapTrails.length) {
    return <MapFallback />;
  }

  return (
    <MapErrorBoundary>
      <div className="relative w-full overflow-hidden rounded-2xl border border-[#00F0FF]/10" data-testid="greece-map">
        <MapContainer
          center={selectedTrail ? [selectedTrail.coordinates.lat, selectedTrail.coordinates.lon] : GREECE_CENTER}
          zoom={6}
          minZoom={5}
          maxZoom={11}
          scrollWheelZoom={false}
          zoomControl={false}
          className="pf-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {mapTrails.map((trail) => {
            const selected = trail.id === selectedTrailId;
            return (
              <Marker
                key={trail.id}
                position={[trail.coordinates.lat, trail.coordinates.lon]}
                icon={markerIcon(selected)}
                eventHandlers={{
                  click: () => onSelectTrail?.(trail),
                }}
              >
              <Tooltip direction="top" offset={[0, -12]} opacity={1} className="pf-leaflet-tooltip">
                <div className="pf-leaflet-tooltip-name">{trail.name}</div>
                <div className="pf-leaflet-tooltip-region">{trail.region}</div>
                <div className="pf-leaflet-tooltip-stats">
                  Eco {trail.sustainabilityScore} · Crowd {trail.crowdPressure}/100
                </div>
              </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050907]/10 via-transparent to-[#050907]/35" />
      </div>
    </MapErrorBoundary>
  );
}
