import React, { useState } from "react";
import VisualPage4 from "./VisualPage4";
import ArrayPage04 from "./Contents/ArrayPage04";
import ARButton4 from "./ARButton4";

const Page4 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton4 />

      <ArrayPage04 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage4 />
      </div>
    </div>
  );
};

export default Page4;
