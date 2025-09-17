import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ModuleHeader from "../components/ModuleHeader";
import ProgressBar from "../components/common/ProgressBar";

import Week4 from "../components/Arrays/Week4";

import Page0 from "../components/DynamicMultiDimensional/Page0";
import Page1 from "../components/DynamicMultiDimensional/Page1";
import Page2 from "../components/DynamicMultiDimensional/Page2";
import Page3 from "../components/DynamicMultiDimensional/Page3";
import Page4 from "../components/DynamicMultiDimensional/Page4";

import { useModuleProgress } from "../services/useModuleProgress";

import { logActivity } from "../services/activityService"; // 👈 import logger
import ARButton from "../components/DynamicMultiDimensional/ARButton";

const DynamicMultiDimensional = () => {
  const navigate = useNavigate();
  const { page } = useParams();

  const pages = [
    <Page0 />,
    <Page1 />,
    <Page2 />,
    <Page3 />,
    <Page4 />,
    <Week4 />,
  ];
  const totalPages = pages.length;

  const pageIndex = Math.min((Number(page) || 1) - 1, totalPages - 1);

  const { currentPage, setCurrentPage, isFinished, finishModule, progress } =
    useModuleProgress("dynamic-and-multi-dimensional-arrays", totalPages);

  useEffect(() => {
    setCurrentPage(pageIndex);

    if (!isFinished) {
      setCurrentPage((prev) => {
        if (pageIndex > prev) return pageIndex;
        return prev;
      });

      logActivity("Dynamic Multi-Dimensional Arrays");
    }
  }, [pageIndex, setCurrentPage, isFinished]);

  const goNext = () => {
    if (currentPage < totalPages - 1) {
      navigate(
        `/modules/dynamic-and-multi-dimensional-arrays/${currentPage + 2}`
      );
    } else {
      finishModule();
      navigate("/modules", {
        state: { route: "dynamic-and-multi-dimensional-arrays" },
      });
    }
  };

  const goPrev = () => {
    if (currentPage > 0) {
      navigate(`/modules/dynamic-and-multi-dimensional-arrays/${currentPage}`); // back to 1-based
    }
  };

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ModuleHeader />
      <ARButton />
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
              navigate("/modules", {
                state: { route: "dynamic-and-multi-dimensional-arrays" },
              });
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

export default DynamicMultiDimensional;
