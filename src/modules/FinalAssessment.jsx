import React from "react";
import { CheckCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import FinalAssessmentHeader from "../components/FinalAssessmentHeader";
import FinalAssessmentContent from "../components/FinalAssessmentContent";

const FinalAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const index = location.state?.index ?? 0;

  const handleFinishModule = () => {
    navigate("/modules", { state: { finishedModuleIndex: index } });
  };

  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <FinalAssessmentHeader />
      <FinalAssessmentContent />
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

export default FinalAssessment;
