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

  const progress =
    totalPages <= 1 ? 100 : Math.round((currentPage / (totalPages - 1)) * 100);

  useEffect(() => {
    const savedProgress = getModuleProgress(route);
    const savedPage = getModulePosition(route);

    setCurrentPage(savedPage);
    if (savedProgress === 100) {
      setIsFinished(true);
    }
  }, [route]);

  useEffect(() => {
    setModulePosition(route, currentPage);

    if (!isFinished) {
      setModuleProgress(route, progress);
    }
  }, [currentPage, progress, route, isFinished]);

  const finishModule = () => {
    setModuleProgress(route, 100);
    setModulePosition(route, totalPages - 1);
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
