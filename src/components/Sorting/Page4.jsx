import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import content from "../../../public/markdown/DynamicPage1.md?raw";
import { Scan } from "lucide-react";
import VisualPage4 from "./VisualPage4";
import SortingPage04 from "./Contents/SortingPage04";

const Page4 = () => {
  const [showWarning, setShowWarning] = useState(false);

  const handleArClick = async () => {
    try {
      if (
        navigator.xr &&
        (await navigator.xr.isSessionSupported("immersive-ar"))
      ) {
        console.log("✅ AR Mode Activated!");
        setShowWarning(false);
      } else {
        throw new Error("AR not supported");
      }
    } catch (err) {
      setShowWarning(true);

      setTimeout(() => {
        setShowWarning(false);
      }, 2500);
    }
  };

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(80vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <SortingPage04 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage4 />

        <button
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-300 ${
            showWarning
              ? "bg-red-500 text-white px-3"
              : "bg-white text-gray-900 hover:bg-gray-100"
          }`}
          onClick={handleArClick}
        >
          {showWarning ? (
            <span className="text-sm font-medium">AR not supported</span>
          ) : (
            <Scan size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default Page4;
