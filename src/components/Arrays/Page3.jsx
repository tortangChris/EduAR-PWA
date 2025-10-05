import React, { useState } from "react";
import VisualPage3 from "./VisualPage3";
import ArrayPage03 from "./Contents/ArrayPage03";
import ARButton3 from "./ARButton3";

const Page3 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton3 />

      <ArrayPage03 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage3 />
      </div>
    </div>
  );
};

export default Page3;
