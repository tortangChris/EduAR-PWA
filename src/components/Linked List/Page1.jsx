import React from "react";
import VisualPage1 from "./VisualPage1";
import ARButton from "./ARButton";
import LinkedListPage01 from "./Contents/LinkedListPage01";

const Page1 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(82vh-6.5rem)] overflow-y-auto p-6 space-y-4 text-left">
      <ARButton />

      <LinkedListPage01 />

      <div className="w-full h-[300px] bg-gray-900 rounded-xl flex items-center justify-center relative">
        <VisualPage1 />
      </div>
    </div>
  );
};

export default Page1;
