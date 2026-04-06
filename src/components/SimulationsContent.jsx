import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Lock, CheckCircle, Clock } from "lucide-react";
import {
  loadSimulationProgress,
  finishSimulation,
  isSimulationUnlocked,
} from "../services/simulationService";

const SimulationsContent = () => {
  const navigate = useNavigate();
  const [simulationsData, setSimulationsData] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSimulationsData(loadSimulationProgress());
  }, []);

  // Re-load progress every time this page becomes visible
  // (para ma-reflect ang finish ng simulation pagbalik dito)
  useEffect(() => {
    const handleFocus = () => {
      setSimulationsData(loadSimulationProgress());
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleClick = (simulation, index) => {
    if (isSimulationUnlocked(simulationsData, index)) {
      navigate(`/${simulation.route}`);
    } else {
      setErrorMessage(
        `⚠️ You need to finish "${simulationsData[index - 1].title}" first.`,
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  const getStatus = (simulation, index) => {
    if (!isSimulationUnlocked(simulationsData, index)) return null;
    if (simulation.progress === 100) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-xs font-semibold">
          <CheckCircle className="w-3 h-3" /> Done
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 text-xs font-medium">
        <Clock className="w-3 h-3" /> In Progress
      </span>
    );
  };

  return (
    <div className="relative">
      {showError && (
        <div className="fixed top-4 right-4 z-50 w-[20rem] animate-slide-in">
          <div className="flex items-center justify-between bg-red-500/90 text-white rounded-xl shadow-lg px-4 py-3 border-l-4 border-red-700">
            <span className="text-sm">{errorMessage}</span>
            <button onClick={() => setShowError(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-base-200 rounded-2xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {simulationsData.map((simulation, index) => (
            <button
              key={simulation.route}
              onClick={() => handleClick(simulation, index)}
              className={`flex flex-col items-start justify-between rounded-2xl p-3 shadow-md transition-all duration-200
                ${
                  isSimulationUnlocked(simulationsData, index)
                    ? "cursor-pointer bg-white dark:bg-neutral hover:ring-2 hover:ring-primary hover:scale-[1.03]"
                    : "cursor-not-allowed bg-gray-100 dark:bg-base-300 opacity-70"
                }`}
            >
              <div className="w-full aspect-square flex items-center justify-center bg-base-300 rounded-xl overflow-hidden relative">
                <img
                  src={simulation.image}
                  alt={simulation.title}
                  className="w-full h-full object-cover"
                />
                {!isSimulationUnlocked(simulationsData, index) && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                    <Lock className="w-7 h-7 text-white" />
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col mt-3 px-1">
                <span className="font-semibold text-left text-primary text-sm mb-2 line-clamp-2">
                  {simulation.title}
                </span>
                {getStatus(simulation, index)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SimulationsContent;
