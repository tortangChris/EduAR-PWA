import { useEffect, useState } from "react";
import {
  getModuleProgress,
  setModuleProgress,
  getModulePosition,
  setModulePosition,
} from "./moduleService";

export function useModuleProgress(route, totalPages) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✅ Load saved state (progress + page)
  useEffect(() => {
    const savedProgress = getModuleProgress(route);
    const savedPage = getModulePosition(route);

    setCurrentPage(savedPage || 0);
    setProgress(savedProgress || 0);

    if (savedProgress === 100) {
      setIsFinished(true);
    }
  }, [route]);

  // ✅ Save state whenever page changes
  useEffect(() => {
    if (totalPages <= 0) return;

    // compute % base sa page (0-based to percentage)
    const newProgress =
      totalPages <= 1
        ? 100
        : Math.round((currentPage / (totalPages - 1)) * 100);

    // save page always
    setModulePosition(route, currentPage);

    if (!isFinished) {
      // ✅ never decrease progress, only increase
      const savedProgress = getModuleProgress(route);
      const updatedProgress = Math.max(savedProgress, newProgress);

      setModuleProgress(route, updatedProgress);
      setProgress(updatedProgress);
    }
  }, [currentPage, totalPages, route, isFinished]);

  const finishModule = () => {
    setModuleProgress(route, 100);
    setModulePosition(route, totalPages - 1); // jump to last page
    setIsFinished(true);
    setProgress(100); // ✅ UI sync agad
  };

  return {
    currentPage,
    setCurrentPage,
    progress,
    isFinished,
    finishModule,
  };
}
