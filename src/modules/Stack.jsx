import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Week9 from "../components/Stack/Week9";
import ModuleHeader from "../components/ModuleHeader";

const Stack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const index = location.state?.index ?? 0;

  const pages = [<Week9 />];
  const totalPages = pages.length;

  const [currentPage, setCurrentPage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const storedProgress =
      JSON.parse(localStorage.getItem("moduleProgress")) || [];
    const storedPositions =
      JSON.parse(localStorage.getItem("modulePagePositions")) || [];

    const savedProgress = storedProgress[index] ?? 0;
    const savedPage = storedPositions[index] ?? 0;

    if (savedProgress === 100) {
      setIsFinished(true);
      setCurrentPage(savedPage);
    } else {
      setCurrentPage(savedPage);
    }

    const todayKey = new Date().toISOString().split("T")[0];
    const storedActivities =
      JSON.parse(localStorage.getItem("recentActivities")) || [];

    const alreadyLogged = storedActivities.some(
      (a) => a.date === todayKey && a.moduleTitle === "Stack"
    );

    if (!alreadyLogged) {
      storedActivities.push({
        moduleTitle: "Stack",
        date: todayKey,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      localStorage.setItem(
        "recentActivities",
        JSON.stringify(storedActivities)
      );
    }
  }, [index]);

  // Compute progress (first page = 0%)
  const progress =
    totalPages <= 1 ? 100 : Math.round((currentPage / (totalPages - 1)) * 100);

  // Save progress & page position
  useEffect(() => {
    const storedProgress =
      JSON.parse(localStorage.getItem("moduleProgress")) || [];
    const storedPositions =
      JSON.parse(localStorage.getItem("modulePagePositions")) || [];

    storedPositions[index] = currentPage;
    localStorage.setItem(
      "modulePagePositions",
      JSON.stringify(storedPositions)
    );

    // FIX: Kapag finished na dati, huwag na i-update progress pababa
    if (storedProgress[index] === 100) {
      return;
    }

    storedProgress[index] = progress;
    localStorage.setItem("moduleProgress", JSON.stringify(storedProgress));
  }, [currentPage, progress, index]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      finishModule();
    }
  };

  const goPrev = () => {
    setCurrentPage((p) => Math.max(0, p - 1));
  };

  const finishModule = () => {
    const storedProgress =
      JSON.parse(localStorage.getItem("moduleProgress")) || [];
    storedProgress[index] = 100;
    localStorage.setItem("moduleProgress", JSON.stringify(storedProgress));

    const storedPositions =
      JSON.parse(localStorage.getItem("modulePagePositions")) || [];
    storedPositions[index] = totalPages - 1;
    localStorage.setItem(
      "modulePagePositions",
      JSON.stringify(storedPositions)
    );

    setIsFinished(true);
    navigate("/modules", { state: { finishedModuleIndex: index } });
  };

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ModuleHeader />

      {pages[currentPage]}

      <div className="flex justify-between">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="btn btn-outline"
        >
          Previous
        </button>

        {currentPage < totalPages - 1 ? (
          <button onClick={goNext} className="btn btn-primary">
            Next
          </button>
        ) : (
          <button
            onClick={finishModule}
            className="btn btn-success flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Finish Module
          </button>
        )}
      </div>
    </div>
  );
};

export default Stack;
