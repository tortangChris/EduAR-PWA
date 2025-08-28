import React, { useEffect } from "react";
import { CheckCircle } from "lucide-react";

const ModuleNav = ({
  currentPage,
  totalPages,
  goPrev,
  goNext,
  finishModule,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        if (currentPage > 0) goPrev();
      }
      if (e.key === "ArrowRight") {
        if (currentPage < totalPages - 1) {
          goNext();
        } else {
          finishModule();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, totalPages, goPrev, goNext, finishModule]);

  return (
    <div className="flex justify-between items-center mt-4">
      <button
        onClick={goPrev}
        disabled={currentPage === 0}
        className="btn btn-outline"
      >
        Previous
      </button>

      <span className="text-sm font-medium">
        Page {currentPage + 1} / {totalPages}
      </span>

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
  );
};

export default ModuleNav;
