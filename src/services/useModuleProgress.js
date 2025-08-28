import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getModuleProgress,
  setModuleProgress,
  getModulePosition,
  setModulePosition,
} from "./moduleService";

export function useModuleProgress(totalPages) {
  const location = useLocation();
  const moduleRoute = location.pathname; // 🔑 auto key based on URL

  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const progress =
    totalPages <= 1 ? 100 : Math.round((currentPage / (totalPages - 1)) * 100);

  // Load progress/page on mount
  useEffect(() => {
    const savedProgress = getModuleProgress(moduleRoute);
    const savedPage = getModulePosition(moduleRoute);

    setCurrentPage(savedPage);

    if (savedProgress === 100) {
      setIsFinished(true);
    }
  }, [moduleRoute]);

  // Save progress/page whenever page changes
  useEffect(() => {
    setModulePosition(moduleRoute, currentPage);

    if (!isFinished) {
      setModuleProgress(moduleRoute, progress);
    }
  }, [currentPage, progress, moduleRoute, isFinished]);

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
