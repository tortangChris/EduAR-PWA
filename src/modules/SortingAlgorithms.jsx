import React from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import SortingAlgorithmsHeader from "../components/SortingAlgorithmsHeader";
import SortingAlgorithmsContent from "../components/SortingAlgorithmsContent";

const SortingAlgorithms = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Get current module index from route state
  const index = location.state?.index ?? 0;

  const handleFinishModule = () => {
    // ✅ Return to /modules with the finished module index
    navigate("/modules", { state: { finishedModuleIndex: index } });
  };

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <SortingAlgorithmsHeader />
      <SortingAlgorithmsContent />
      <div className="flex justify-end">
        <button
          onClick={handleFinishModule}
          className="btn btn-success flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Finish Module
        </button>
      </div>
    </div>
  );
};

export default SortingAlgorithms;
