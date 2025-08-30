import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getModuleProgress,
  setModuleProgress,
  getModulePosition,
  setModulePosition,
} from "./moduleService";

// Custom hook to track module progress (acts like a FSM)
export function useModuleProgress(totalPages) {
  const location = useLocation();
  const moduleRoute = location.pathname;

  // FSM state: current page in the module
  const [currentPage, setCurrentPage] = useState(0);

  // FSM state: whether the module has reached the "finished" state
  const [isFinished, setIsFinished] = useState(false);

  // Derived state: progress percentage
  const progress =
    totalPages <= 1 ? 100 : Math.round((currentPage / (totalPages - 1)) * 100);

  // Initialize FSM states from saved data
  useEffect(() => {
    const savedProgress = getModuleProgress(moduleRoute);
    const savedPage = getModulePosition(moduleRoute);

    // Set FSM initial state to saved position
    setCurrentPage(savedPage);

    // If progress is complete, move FSM to "finished" state
    if (savedProgress === 100) {
      setIsFinished(true);
    }
  }, [moduleRoute]);

  // Whenever currentPage changes, update FSM states in storage
  useEffect(() => {
    // Save FSM state: current page
    setModulePosition(moduleRoute, currentPage);

    // Save FSM state: progress (only if not finished)
    if (!isFinished) {
      setModuleProgress(moduleRoute, progress);
    }
  }, [currentPage, progress, moduleRoute, isFinished]);

  // Action to explicitly move FSM to "finished" state
  const finishModule = () => {
    setModuleProgress(moduleRoute, 100);
    setModulePosition(moduleRoute, totalPages - 1);
    setIsFinished(true);
  };

  return {
    currentPage,
    setCurrentPage,
    progress,
    isFinished,
    finishModule,
  };
}
