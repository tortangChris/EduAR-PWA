import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Lock } from "lucide-react";
import {
  loadProgress,
  finishModule,
  isUnlocked,
} from "../services/moduleService";

function normalizeRouteKey(route) {
  if (!route) return "";
  return route.replace(/^\/modules\//, "").replace(/^\//, "");
}

const ModulesContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [modulesData, setModulesData] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setModulesData(loadProgress());
  }, []);

  // Update finished module based on route (not index)
  useEffect(() => {
    if (location.state?.route && modulesData.length > 0) {
      const key = normalizeRouteKey(location.state.route);
      const moduleIndex = modulesData.findIndex(
        (m) => normalizeRouteKey(m.route) === key
      );

      if (moduleIndex !== -1 && modulesData[moduleIndex].progress < 100) {
        const updated = finishModule(modulesData, moduleIndex);
        setModulesData(updated);
      }
    }
  }, [location.state, modulesData]);

  const handleClick = (module, index) => {
    if (isUnlocked(modulesData, index)) {
      navigate(module.route, { state: { route: module.route } });
    } else {
      setErrorMessage(
        `⚠️ You need to finish "${modulesData[index - 1].title}" first.`
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="relative">
      {showError && (
        <div className="alert alert-error shadow-lg fixed top-4 right-4 z-50 w-[20rem] animate-fade-in">
          <div className="flex items-center justify-between w-full">
            <span>{errorMessage}</span>
            <button onClick={() => setShowError(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {modulesData.map((module, index) => (
            <button
              key={normalizeRouteKey(module.route)}
              onClick={() => handleClick(module, index)}
              className={`flex flex-col items-start justify-between rounded-lg p-2 shadow transition-all duration-150
                ${
                  isUnlocked(modulesData, index)
                    ? "cursor-pointer bg-white dark:bg-neutral hover:ring-2 hover:ring-primary hover:scale-[1.02]"
                    : "cursor-not-allowed bg-gray-100 dark:bg-base-300 opacity-70"
                }`}
            >
              <div className="w-full aspect-square flex items-center justify-center bg-gray-200 rounded-md overflow-hidden relative">
                <img
                  src={module.image}
                  alt={module.title}
                  className="w-full h-full object-contain"
                />
                {!isUnlocked(modulesData, index) && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
              <div className="w-full flex flex-col mt-2 px-1">
                <span className="font-semibold text-left text-primary text-sm mb-1">
                  {module.title}
                </span>
                <progress
                  className="progress w-full progress-primary"
                  value={module.progress}
                  max="100"
                ></progress>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModulesContent;
