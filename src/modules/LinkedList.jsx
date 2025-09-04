import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import Page1 from "../components/Linked List/Page1";
import Page2 from "../components/Linked List/Page2";
import Page3 from "../components/Linked List/Page3";
import Page4 from "../components/Linked List/Page4";
import PageAssessment from "../components/Linked List/PageAssessment";

import { useModuleProgress } from "../services/useModuleProgress";

import { logActivity } from "../services/activityService"; // 👈 import logger

const LinkedList = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  const pages = [
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
    useModuleProgress("linked-list", totalPages);

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

      logActivity("Arrays & Time Complexity");
    }
  }, [pageIndex, setCurrentPage, isFinished]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      navigate(`/modules/linked-list/${currentPage + 2}`); // +2 para 1-based
    } else {
      finishModule();
      navigate("/modules", { state: { finishedModuleIndex: 0 } });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/linked-list/${currentPage}`); // back to 1-based
    }
  };

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ModuleHeader />

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
          Page {currentPage + 1} / {pages.length}
        </span>

        {currentPage < pages.length - 1 ? (
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

export default LinkedList;
