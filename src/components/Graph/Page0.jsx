import React from "react";
import ReactMarkdown from "react-markdown";
import content from "../../../public/markdown/GraphPage0.md?raw";

const Page0 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(86vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <div className="markdown-body mb-6">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
};

export default Page0;
