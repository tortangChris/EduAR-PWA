import React, { useEffect } from "react";
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

const StackAndQueue = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  const pages = [
    <Page0 />,
    <Page1 />,
    <Page2 />,
    <Page3 />,
    <Page4 />,
    <Page5 />,
    <Page6 />,
  ];

  const totalPages = pages.length;

  const pageIndex = Math.min((Number(page) || 1) - 1, totalPages - 1);

  const { currentPage, setCurrentPage, isFinished, finishModule, progress } =
    useModuleProgress("stack-and-queue", totalPages);

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
      finishModule();
      navigate("/modules", { state: { route: "stack-and-queue" } });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/stack-and-queue/${currentPage}`);
    }
  };

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
          <button
            onClick={() => {
              finishModule();
              navigate("/modules", { state: { route: "stack-and-queue" } });
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

export default StackAndQueue;
