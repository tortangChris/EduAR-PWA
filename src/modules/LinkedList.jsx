import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import ProgressBar from "../components/common/ProgressBar";

import Page1 from "../components/Linked List/Page1";
import Page2 from "../components/Linked List/Page2";
import Page3 from "../components/Linked List/Page3";
import Page4 from "../components/Linked List/Page4";
import PageAssessment from "../components/Linked List/PageAssessment";

import { useModuleProgress } from "../services/useModuleProgress";

import { logActivity } from "../services/activityService"; // 👈 import logger
import Page5 from "../components/Linked List/Page5";

const LinkedList = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  const pages = [<Page1 />, <Page2 />, <Page3 />, <Page4 />, <Page5 />];
  const totalPages = pages.length;

  const pageIndex = Math.min((Number(page) || 1) - 1, totalPages - 1);

  const { currentPage, setCurrentPage, isFinished, finishModule, progress } =
    useModuleProgress("linked-list", totalPages);

  useEffect(() => {
    setCurrentPage(pageIndex);

    if (!isFinished) {
      setCurrentPage((prev) => {
        if (pageIndex > prev) return pageIndex;
        return prev;
      });

      logActivity("Linked List Varation");
    }
  }, [pageIndex, setCurrentPage, isFinished]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      navigate(`/modules/linked-list/${currentPage + 2}`);
    } else {
      finishModule();
      navigate("/modules", { state: { route: "linked-list" } });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/linked-list/${currentPage}`);
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
              navigate("/modules", { state: { route: "linked-list" } });
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
