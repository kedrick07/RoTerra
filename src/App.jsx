import { useState } from "react";
import Nav from "./components/Nav";
import EvidenceDrawer from "./components/EvidenceDrawer";
import Home from "./pages/Home";
import Explorer from "./pages/Explorer";
import Comparison from "./pages/Comparison";
import Methodology from "./pages/Methodology";

export default function App() {
  const [page, setPage] = useState("Home");
  const [why, setWhy] = useState(null);
  const [priorities, setPriorities] = useState({ water: 80, income: 65, soil: 50, pest: 35, equipment: 20 });
  const go = (p) => { setPage(p); window.scrollTo(0, 0); };
  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-16 pb-16">
      <Nav page={page} go={go} />
      {page === "Home" && <Home go={go} />}
      {page === "Explorer" && <Explorer go={go} priorities={priorities} setPriorities={setPriorities} onWhy={setWhy} />}
      {page === "Comparison" && <Comparison priorities={priorities} onWhy={setWhy} />}
      {page === "Methodology" && <Methodology />}
      <EvidenceDrawer k={why} close={() => setWhy(null)} />
    </div>
  );
}
