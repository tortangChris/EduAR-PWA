import { CheckCircle } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import content from "../../public/markdown/1.md?raw";

const IntroToAlgorithmsContent = () => {
  const navigate = useNavigate();

  const handleFinishModule = () => {
    navigate("/modules");
  };

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(86vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ReactMarkdown>{content}</ReactMarkdown>

      <div className="flex justify-end pt-4">
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

export default IntroToAlgorithmsContent;
