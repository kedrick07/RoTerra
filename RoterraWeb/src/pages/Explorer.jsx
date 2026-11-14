import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TrendCarousel from "../components/TrendCarousel";
import { criteria } from "../data/placeholder";

// Preset plots for the dropdown. Add more here later.
const PLOTS = {
  colusa: { label: "Demo plot: Colusa Basin, California", pos: [39.2143, -122.0094] },
};
const DEFAULT = PLOTS.colusa.pos;

// Listens for map clicks and reports the clicked point
function ClickToSelect({ onSelect }) {
  useMapEvents({ click: (e) => onSelect([e.latlng.lat, e.latlng.lng]) });
  return null;
}

// Moves the map when the selected plot changes
function FlyTo({ pos }) {
  const map = useMap();
  useEffect(() => { map.flyTo(pos, Math.max(map.getZoom(), 11)); }, [pos, map]);
  return null;
}

export default function Explorer({ go, priorities, setPriorities, onWhy }) {
  const [plot, setPlot] = useState(DEFAULT);
  const [lat, lon] = plot;

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
        <div>
          <select className="select border-2 border-black bg-[#e5e7e8] mb-2 w-72"
            onChange={(e) => setPlot(PLOTS[e.target.value].pos)}>
            {Object.entries(PLOTS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>

          <div className="h-[340px] border-2 border-black rounded-md overflow-hidden">
            <MapContainer center={DEFAULT} zoom={10} style={{ height: "100%" }}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <ClickToSelect onSelect={setPlot} />
              <FlyTo pos={plot} />
              <CircleMarker center={plot} radius={14} pathOptions={{ color: "red", fillColor: "#ff3c5a", fillOpacity: 0.4 }}>
                <Popup>Selected plot<br />{lat.toFixed(5)}, {lon.toFixed(5)}</Popup>
              </CircleMarker>
            </MapContainer>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <p className="font-semibold">Lat: {lat.toFixed(5)} · Lon: {lon.toFixed(5)}</p>
            <button className="btn btn-xs" onClick={() => navigator.clipboard.writeText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`)}>Copy</button>
            <button className="btn btn-xs" onClick={() => setPlot(DEFAULT)}>Reset to demo plot</button>
          </div>
          <p className="note mt-1">Click anywhere on the map to select a plot.</p>
        </div>
        <TrendCarousel onWhy={onWhy} />
      </div>

      <div className="glass mt-6">
        <h3>Your priorities <button className="text-sm font-normal" onClick={() => onWhy("priorities")}>(Why?)</button></h3>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-3 items-center">
          {criteria.map((c) => (
            <label key={c} className="grid grid-cols-[90px_1fr_36px] items-center gap-3 capitalize">
              <span>{c}</span>
              <input type="range" min="0" max="100" value={priorities[c]} className="range range-xs"
                onChange={(e) => setPriorities({ ...priorities, [c]: +e.target.value })} />
              <span>{priorities[c]}</span>
            </label>
          ))}
          <div className="flex justify-end"><button className="btn btn-ghost-ink h-12" onClick={() => go("Comparison")}>Compare rotations</button></div>
        </div>
      </div>
    </>
  );
}