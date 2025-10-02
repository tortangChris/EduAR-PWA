import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import content from "../../../public/markdown/ArrayPage3.md?raw";
import VisualPage3 from "./VisualPage3";
import ARButton from "./ARButton";
import { useModuleProgress } from "../../services/useModuleProgress";

const Page3 = () => {
  const [showWarning, setShowWarning] = useState(false);

  const { currentPage } = useModuleProgress("/modules/arraypage1", 6);

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton currentPage={currentPage} />

      <div className="markdown-body">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage3 />
      </div>
    </div>
  );
};

export default Page3;
