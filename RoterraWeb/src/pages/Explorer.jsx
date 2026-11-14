import { MapContainer, TileLayer, CircleMarker, Rectangle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import TrendCarousel from "../components/TrendCarousel";
import siteData from "../../../public/data/site.json";
import { DIMENSIONS, DIMENSION_LABELS } from "../../../src/lib/scoringConfig.js";

const POS = [siteData.lat, siteData.lon];
// bbox in site.json is [minLon, minLat, maxLon, maxLat]
const SITE_BOUNDS = [[siteData.bbox[1], siteData.bbox[0]], [siteData.bbox[3], siteData.bbox[2]]];

export default function Explorer({ go, priorities, setPriorities, onWhy }) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] items-start">
        <div>
          <select className="select border-2 border-black bg-[#e5e7e8] mb-2 w-72">
            <option>{siteData.name}</option>
          </select>
          <div className="h-[340px] border-2 border-black rounded-md overflow-hidden">
            <MapContainer center={POS} zoom={10} style={{ height: "100%" }}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
              <Rectangle bounds={SITE_BOUNDS} pathOptions={{ color: "#3E7C3A", weight: 2, fillOpacity: 0.08 }} />
              <CircleMarker center={POS} radius={10} pathOptions={{ color: "red", fillColor: "#ff3c5a", fillOpacity: 0.4 }}>
                <Popup>{siteData.name}<br />{siteData.lat.toFixed(5)}, {siteData.lon.toFixed(5)}</Popup>
              </CircleMarker>
            </MapContainer>
          </div>
          <p className="font-semibold mt-2">Lat: {siteData.lat.toFixed(5)} · Lon: {siteData.lon.toFixed(5)}</p>
          <p className="note">All data shown is for the demo site outlined in green. Other locations are not yet supported.</p>
        </div>
        <TrendCarousel onWhy={onWhy} />
      </div>

      <div className="glass mt-6">
        <h3>Your priorities <button className="text-sm font-normal" onClick={() => onWhy("priorities")}>(Why?)</button></h3>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-3 items-center">
          {DIMENSIONS.map((c) => (
            <label key={c} className="grid grid-cols-[110px_1fr_36px] items-center gap-3">
              <span>{DIMENSION_LABELS[c]}</span>
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