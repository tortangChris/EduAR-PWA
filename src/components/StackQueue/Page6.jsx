import React, { useState } from "react";
import { Scan } from "lucide-react";
import ARButton from "./ARButton";
import StackQueueAssessment from "./StackQueueAssessment";

const Page6 = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [showAR, setShowAR] = useState(false);

  const handleArClick = async () => {
    try {
      if (
        navigator.xr &&
        (await navigator.xr.isSessionSupported("immersive-ar"))
      ) {
        console.log("✅ AR Mode Activated!");
        setShowWarning(false);
        setShowAR(true); // switch to ARPage6
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
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <StackQueueAssessment />

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

export default Page6;
