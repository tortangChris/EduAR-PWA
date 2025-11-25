import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import ProgressBar from "../components/common/ProgressBar";

import Page1 from "../components/Linked List/Page1";
import Page2 from "../components/Linked List/Page2";
import Page3 from "../components/Linked List/Page3";
import Page4 from "../components/Linked List/Page4";

import { useModuleProgress } from "../services/useModuleProgress";

import { logActivity } from "../services/activityService"; // 👈 import logger
import Page0 from "../components/Linked List/Page0";
import Page5 from "../components/Linked List/Page5";
import PageInteractive from "../components/Linked List/PageInteractive";

const LinkedList = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  // 🔹 Track kung pasado na yung Linked List assessment
  const [linkedListAssessmentPassed, setLinkedListAssessmentPassed] =
    useState(false);

  const pages = [
    <Page0 />,
    <Page1 />,
    <Page2 />,
    <Page3 />,
    <Page4 />,
    <PageInteractive
      onAssessmentPassStatusChange={(passed) =>
        setLinkedListAssessmentPassed(passed)
      }
    />,
    // <Page5 />,
  ];
  const totalPages = pages.length;

  const pageIndex = Math.min((Number(page) || 1) - 1, totalPages - 1);

  const { currentPage, setCurrentPage, isFinished, finishModule, progress } =
    useModuleProgress("linked-list", totalPages);

  // 🔹 On mount: basahin kung previously passed na yung Linked List assessment
  useEffect(() => {
    try {
      const stored = localStorage.getItem("linkedListAssessmentPassed");
      if (stored === "true") {
        setLinkedListAssessmentPassed(true);
      }
    } catch (e) {
      console.warn("Unable to read localStorage", e);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(pageIndex);

    if (!isFinished) {
      setCurrentPage((prev) => {
        if (pageIndex > prev) return pageIndex;
        return prev;
      });

      logActivity("Linked List Variation");
    }
  }, [pageIndex, setCurrentPage, isFinished]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      navigate(`/modules/linked-list/${currentPage + 2}`);
    } else {
      // last page; real gating nasa Finish button pa rin
      finishModule();
      navigate("/modules", { state: { route: "linked-list" } });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/linked-list/${currentPage}`);
    }
  };

  const onFinishClick = () => {
    if (!linkedListAssessmentPassed) return; // safety guard
    finishModule();
    navigate("/modules", { state: { route: "linked-list" } });
  };

  const isLastPage = currentPage === totalPages - 1;

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ModuleHeader />
      {/* <ProgressBar progress={progress} /> */}

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
          <div className="flex flex-col items-end">
            <button
              onClick={onFinishClick}
              disabled={!linkedListAssessmentPassed}
              className="btn btn-success flex items-center gap-2 disabled:btn-disabled"
            >
              <CheckCircle className="w-5 h-5" />
              {linkedListAssessmentPassed ? "Finish Module" : "Finish Locked"}
            </button>
            {!linkedListAssessmentPassed && (
              <span className="text-xs text-error mt-1">
                Pass the assessment.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedList;
