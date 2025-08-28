import React from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import Page1 from "../components/Sorting/Page1";
import Page2 from "../components/Sorting/Page2";
import Page3 from "../components/Sorting/Page3";
import PageAssessment from "../components/Sorting/PageAssessment";

import { useModuleProgress } from "../services/useModuleProgress";

const Sorting = () => {
  const navigate = useNavigate();

  const pages = [<Page1 />, <Page2 />, <Page3 />, <PageAssessment />];

  const { currentPage, setCurrentPage, progress, isFinished, finishModule } =
    useModuleProgress(pages.length);

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      finishModule();
      navigate("/modules", { state: { finishedModuleIndex: 0 } }); // 0 kasi Arrays yung unang module
    }
  };

  const goPrev = () => {
    setCurrentPage((p) => Math.max(0, p - 1));
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

export default Sorting;
