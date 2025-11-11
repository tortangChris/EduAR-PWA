import React, { useState } from "react";
import VisualPage5 from "./VisualPage5";
import ArrayPage05 from "./Contents/ArrayPage05";
import ARButton5 from "./ARButton5";

const Page5 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton5 />

      <ArrayPage05 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage5 />
      </div>
    </div>
  );
};

export default Page5;
