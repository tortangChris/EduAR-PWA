import React, { useState } from "react";
import VisualPage3 from "./VisualPage3";
import ARButton from "./ARButton";
import { useModuleProgress } from "../../services/useModuleProgress";
import ArrayPage03 from "./Contents/ArrayPage03";

const Page3 = () => {
  const [showWarning, setShowWarning] = useState(false);

  const { currentPage } = useModuleProgress("/modules/arraypage1", 6);

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton currentPage={currentPage} />

      <ArrayPage03 />
      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage3 />
      </div>
    </div>
  );
};

export default Page3;
