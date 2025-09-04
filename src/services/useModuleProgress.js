import { useEffect, useState } from "react";
import {
  getModuleProgress,
  setModuleProgress,
  getModulePosition,
  setModulePosition,
} from "./moduleService";

function normalizeRouteKey(route) {
  if (!route) return "";
  // remove leading slash at "/modules/"
  return route.replace(/^\/modules\//, "").replace(/^\//, "");
}

export function useModuleProgress(route, totalPages) {
  const key = normalizeRouteKey(route);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  // Load saved state (progress + page)
  useEffect(() => {
    const savedProgress = getModuleProgress(key);
    const savedPage = getModulePosition(key);

    setCurrentPage(savedPage || 0);
    setProgress(savedProgress || 0);

    if (savedProgress === 100) {
      setIsFinished(true);
    }
  }, [key]);

  // Save state whenever page changes
  useEffect(() => {
    if (totalPages <= 0) return;

    // compute % base sa page (0-based to percentage)
    const newProgress =
      totalPages <= 1
        ? 100
        : Math.round((currentPage / (totalPages - 1)) * 100);

    setModulePosition(key, currentPage);

    if (!isFinished) {
      // never decrease progress, only increase
      const savedProgress = getModuleProgress(key);
      const updatedProgress = Math.max(savedProgress, newProgress);

      setModuleProgress(key, updatedProgress);
      setProgress(updatedProgress);
    }
  }, [currentPage, totalPages, key, isFinished]);

  const finishModule = () => {
    setModuleProgress(key, 100);
    setModulePosition(key, totalPages - 1); // jump to last page
    setIsFinished(true);
    setProgress(100);
  };

  return {
    currentPage,
    setCurrentPage,
    progress,
    isFinished,
    finishModule,
  };
}
