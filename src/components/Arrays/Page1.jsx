import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import content from "../../../public/markdown/ArrayPage1.md?raw";
import VisualPage1 from "./VisualPage1";
import ARButton from "./ARButton"; // ✅ centralized na dito

const Page1 = () => {
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      {/* ✅ ARButton will handle ARPage1 rendering */}
      <ARButton />

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
