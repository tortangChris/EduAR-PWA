import React from "react";
import IntroToAlgorithmsHeader from "../components/IntroToAlgorithmsHeader";
import IntroToAlgorithmsContent from "../components/IntroToAlgorithmsContent";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IntroductionToAlgorithms = () => {
  const navigate = useNavigate();

  const handleFinishModule = () => {
    navigate("/modules");
  };
  return (
    <div className="h-[calc(100vh)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <IntroToAlgorithmsHeader />
      <IntroToAlgorithmsContent />
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

export default IntroductionToAlgorithms;
