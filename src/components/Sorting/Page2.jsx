import React from "react";
import VisualPage2 from "./VisualPage2";
import ARButton2 from "./ARButton2";
import SortingPage02 from "./Contents/SortingPage02";

const Page2 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton2 />

      <SortingPage02 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage2 />
      </div>
    </div>
  );
};

export default Page2;
