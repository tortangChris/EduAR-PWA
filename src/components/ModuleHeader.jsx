import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import moduleConfig from "../config/modules";

const ModuleHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // moduleId ("/modules/arrays/page1" -> "arrays")
  const pathParts = location.pathname.split("/");
  const moduleId = pathParts[2]; // index 2 = module name

  const title = moduleConfig[moduleId] || "Module";

  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/modules")}
          className="p-2 rounded-full hover:bg-base-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>
    </div>
  );
};

export default ModuleHeader;
