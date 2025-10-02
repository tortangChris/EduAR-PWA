import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import content from "../../../public/markdown/ArrayPage1.md?raw";
import VisualPage1 from "./VisualPage1";
import ARButton from "./ARButton";
import { useModuleProgress } from "../../services/useModuleProgress"; // 👈 import FSM hook

const Page1 = () => {
  const [showWarning, setShowWarning] = useState(false);

  // ✅ kunin progress state
  const { currentPage } = useModuleProgress("/modules/arraypage1", 6);
  // depende sa total pages mo, adjust mo yung "6"

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      {/* ✅ ipasa currentPage */}
      <ARButton currentPage={currentPage} />

      <div className="markdown-body">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage1 />
      </div>
    </div>
  );
};

export default Page1;
