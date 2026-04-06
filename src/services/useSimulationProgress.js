import { useEffect, useState, useCallback } from "react";
import SimulationStorage from "./SimulationStorage";
import simulationsConfig from "../config/simulationsConfig";

export function useSimulationProgress(route) {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  // Hanapin ang required completions para sa route na ito
  const config = simulationsConfig.find((m) => m.route === route);
  const requiredCompletions = config?.requiredCompletions ?? 1;

  useEffect(() => {
    const saved = SimulationStorage.getSimulationProgress(route);
    const count = SimulationStorage.getCompletedCount(route);
    setProgress(saved);
    setCompletedCount(count);
    if (saved === 100) setIsFinished(true);
  }, [route]);

  // Tinatawag kapag nag-complete ng isang tutorial (hindi skip)
  const markProgress = useCallback(() => {
    const newCount = SimulationStorage.incrementCompletedCount(route);
    setCompletedCount(newCount);

    // I-compute ang bagong progress percentage
    const newProgress = Math.min(
      100,
      Math.round((newCount / requiredCompletions) * 100),
    );

    // Hindi bababa ang progress, palaging tataas
    const currentProgress = SimulationStorage.getSimulationProgress(route);
    const updatedProgress = Math.max(currentProgress, newProgress);

    SimulationStorage.setSimulationProgress(route, updatedProgress);
    setProgress(updatedProgress);

    if (updatedProgress >= 100) {
      setIsFinished(true);
    }
  }, [route, requiredCompletions]);

  return {
    progress,
    isFinished,
    completedCount,
    requiredCompletions,
    markProgress,
  };
}
