import React, { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import Page0 from "../components/StackQueue/Page0";
import Page1 from "../components/StackQueue/Page1";
import Page2 from "../components/StackQueue/Page2";
import Page3 from "../components/StackQueue/Page3";
import Page4 from "../components/StackQueue/Page4";
import Page5 from "../components/StackQueue/Page5";
import ProgressBar from "../components/common/ProgressBar";

import { useModuleProgress } from "../services/useModuleProgress";

import { logActivity } from "../services/activityService";
import Page6 from "../components/StackQueue/Page6";
import PageInteractive from "../components/StackQueue/PageInteractive";

const StackAndQueue = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  // 🔹 Track kung pasado na yung Stack & Queue assessment
  const [stackQueueAssessmentPassed, setStackQueueAssessmentPassed] =
    useState(false);

  const pages = [
    <Page0 />,
    <Page1 />,
    <Page2 />,
    <PageInteractive
      onAssessmentPassStatusChange={(passed) =>
        setStackQueueAssessmentPassed(passed)
      }
    />,
    // <Page3 />,
    // <Page4 />,
    // <Page5 />,
  ];

  const totalPages = pages.length;

  const pageIndex = Math.min((Number(page) || 1) - 1, totalPages - 1);

  const { currentPage, setCurrentPage, isFinished, finishModule, progress } =
    useModuleProgress("stack-and-queue", totalPages);

  // 🔹 On mount: basahin kung previously passed na yung Stack & Queue assessment
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stackQueueAssessmentPassed");
      if (stored === "true") {
        setStackQueueAssessmentPassed(true);
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

      logActivity("Stack and Queue");
    }
  }, [pageIndex, setCurrentPage, isFinished]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      navigate(`/modules/stack-and-queue/${currentPage + 2}`);
    } else {
      // last page; real gating nasa Finish button
      finishModule();
      navigate("/modules", { state: { route: "stack-and-queue" } });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/stack-and-queue/${currentPage}`);
    }
  };

  const onFinishClick = () => {
    if (!stackQueueAssessmentPassed) return; // safety guard
    finishModule();
    navigate("/modules", { state: { route: "stack-and-queue" } });
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
              disabled={!stackQueueAssessmentPassed}
              className="btn btn-success flex items-center gap-2 disabled:btn-disabled"
            >
              <CheckCircle className="w-5 h-5" />
              {stackQueueAssessmentPassed ? "Finish Module" : "Finish Locked"}
            </button>
            {!stackQueueAssessmentPassed && (
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

export default StackAndQueue;
