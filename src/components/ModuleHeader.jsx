import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

// Para hindi hardcoded, gagamit tayo ng config
const moduleConfig = {
  "/modules/arrays": "Arrays",
  "/modules/sorting": "Sorting",
  "/modules/linked-list": "Linked List",
  "/modules/stack": "Stack",
  "/modules/queue": "Queue",
  "/modules/trees": "Trees",
  "/modules/set-data-structure": "Set Data Structure",
  "/modules/graph-data-structure": "Graph Data Structure",
  "/modules/map-data-structure": "Map Data Structure",
  "/modules/hash-table": "Hash Table",
  // pwede ka pa magdagdag dito ng iba
};

const ModuleHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hanapin kung anong title base sa current route
  const title = moduleConfig[location.pathname] || "Module";

  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/modules")}
          className="p-2 rounded-full hover:bg-base-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-m font-bold">{title}</h2>
      </div>
    </div>
  );
};

export default ModuleHeader;
