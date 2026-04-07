import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, CheckCircle, Clock } from "lucide-react";
import simulationsConfig from "../config/simulationsConfig";
import SimulationStorage from "../services/Simulationstorage";

function normalizeRouteKey(route) {
  if (!route) return "";
  return route.replace(/^\//, "");
}

const SimulationsContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [modules, setModules] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = () => {
    setModules(SimulationStorage.loadSimulationProgress(simulationsConfig));
  };

  useEffect(() => {
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, []);

  // ✅ Same pattern as ModulesContent — reload when navigating back
  useEffect(() => {
    if (location.state?.completedRoute && modules.length > 0) {
      const key = normalizeRouteKey(location.state.completedRoute);
      const moduleIndex = modules.findIndex(
        (m) => normalizeRouteKey(m.route) === key,
      );
      if (moduleIndex !== -1) {
        SimulationStorage.setSimulationProgress(
          modules[moduleIndex].route,
          100,
        );
        load();
      }
    }
  }, [location.state, modules.length]);

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return modules[index - 1]?.progress === 100;
  };

  const handleClick = (module, index) => {
    if (isUnlocked(index)) {
      navigate(`/${module.route}`);
    } else {
      setErrorMessage(
        `⚠️ You need to finish "${modules[index - 1]?.title}" first.`,
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const getStatus = (module, index) => {
    if (!isUnlocked(index)) return null;
    if (module.progress === 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
          <CheckCircle className="w-3 h-3" /> Done
        </span>
      );
    }
    if (module.progress > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 text-xs font-medium">
          <Clock className="w-3 h-3" /> In Progress
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative">
      {showError && (
        <div className="fixed top-4 right-4 z-50 w-[20rem]">
          <div className="flex items-center justify-between bg-red-500/90 text-white rounded-xl shadow-lg px-4 py-3 border-l-4 border-red-700">
            <span className="text-sm">{errorMessage}</span>
            <button onClick={() => setShowError(false)}>✕</button>
          </div>
        </div>
      )}

      <div className="bg-base-200 rounded-2xl shadow-md p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {modules.map((module, index) => (
            <button
              key={module.route}
              onClick={() => handleClick(module, index)}
              className={`flex flex-col items-start justify-between rounded-2xl p-3 shadow-md transition-all duration-200
                ${
                  isUnlocked(index)
                    ? "cursor-pointer bg-white dark:bg-neutral hover:ring-2 hover:ring-primary hover:scale-[1.03]"
                    : "cursor-not-allowed bg-gray-100 dark:bg-base-300 opacity-70"
                }`}
            >
              <div className="w-full aspect-square flex items-center justify-center bg-base-300 rounded-xl overflow-hidden relative">
                <img
                  src={module.image}
                  alt={module.title}
                  className="w-full h-full object-cover"
                />
                {!isUnlocked(index) && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col mt-3 px-1">
                <span className="font-semibold text-left text-primary text-sm mb-1 line-clamp-2">
                  {module.title}
                </span>
                {isUnlocked(index) &&
                  module.progress > 0 &&
                  module.progress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-1">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  )}
                {getStatus(module, index)}
                {isUnlocked(index) && module.progress < 100 && (
                  <span className="text-[10px] text-gray-400 mt-1">
                    {SimulationStorage.getCompletedCount(module.route)}/
                    {module.requiredCompletions} tutorials
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationsContent;
