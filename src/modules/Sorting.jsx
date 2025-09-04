import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import Page1 from "../components/Sorting/Page1";
import Page2 from "../components/Sorting/Page2";
import Page3 from "../components/Sorting/Page3";
import PageAssessment from "../components/Sorting/PageAssessment";

import { useModuleProgress } from "../services/useModuleProgress";
import Page0 from "../components/Sorting/Page0";
import Page4 from "../components/Sorting/Page4";

import { logActivity } from "../services/activityService"; // 👈 import logger

const Sorting = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  const pages = [
    <Page0 />,
    <Page1 />,
    <Page2 />,
    <Page3 />,
    <Page4 />,
    <PageAssessment />,
  ];
  const totalPages = pages.length;

  // 🔑 Convert 1-based URL param to 0-based index
  const pageIndex = Math.min((Number(page) || 1) - 1, totalPages - 1);

  const { currentPage, setCurrentPage, isFinished, finishModule, progress } =
    useModuleProgress("sorting", totalPages);

  // ✅ Sync URL param to state + log activity
  useEffect(() => {
    // ✅ Lagi pa rin sinusync sa URL param (kahit finished na)
    setCurrentPage(pageIndex);

    if (!isFinished) {
      // 📝 Update progress lang kung hindi pa finished
      setCurrentPage((prev) => {
        if (pageIndex > prev) return pageIndex;
        return prev;
      });

      logActivity("Sorting Algorithms");
    }
  }, [pageIndex, setCurrentPage, isFinished]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      navigate(`/modules/sorting/${currentPage + 2}`); // +2 para 1-based
    } else {
      finishModule();
      navigate("/modules", { state: { finishedModuleIndex: 1 } });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/sorting/${currentPage}`); // back to 1-based
    }
  };

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ModuleHeader />

      {/* ✅ Progress Bar */}
      <p className="text-sm text-center mb-2 font-medium">
        Progress: {progress}%
      </p>
      <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
        <div
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {pages[currentPage]}

      <div className="flex justify-between items-center">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="btn btn-outline"
        >
          Previous
        </button>

        <span className="text-sm font-semibold">
          Page {currentPage + 1} / {totalPages}
        </span>

        {currentPage < totalPages - 1 ? (
          <button onClick={goNext} className="btn btn-primary">
            Next
          </button>
        ) : (
          <button
            onClick={() => {
              finishModule();
              navigate("/modules", { state: { finishedModuleIndex: 0 } });
            }}
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

export default Sorting;
