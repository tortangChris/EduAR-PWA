import React from "react";
import VisualPage2 from "./VisualPage2";
import GraphPage02 from "./Contents/GraphPage02";
import ARButton2 from "../Arrays/ARButton2";

const Page2 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton2 />

      <GraphPage02 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage2 />
      </div>
    </div>
  );
};

export default Page2;
