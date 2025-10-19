import React from "react";
import VisualPage4 from "./VisualPage1";
import ARButton from "./ARButton";
import SortingPage04 from "./Contents/SortingPage05";

const Page4 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton />

      <SortingPage04 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage4 />
      </div>
    </div>
  );
};

export default Page4;
