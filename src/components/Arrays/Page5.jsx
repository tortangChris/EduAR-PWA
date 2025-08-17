import React from "react";
import { useNavigate } from "react-router-dom";

const Page5 = () => {
  const navigate = useNavigate();

  const handle3DModeClick = () => {
    navigate("3dMode");
  };

  const handleARModeClick = () => {
    console.log("AR Mode clicked");
  };

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(86vh-6.5rem)] overflow-y-auto p-6 flex flex-col items-center justify-center gap-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 text-center">
        Array Visualization
      </h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* 3D Mode Button */}
        <button
          onClick={handle3DModeClick}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-xl p-4 flex flex-col items-center w-48 hover:scale-105 transition-transform"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center overflow-hidden">
            <img
              src="/images/threeDMode.png" // <-- palitan mo ng image file path mo
              alt="3D Mode"
              className="object-contain w-full h-full"
            />
          </div>
          <span className="mt-2 font-semibold text-center">
            Interact with 3D Mode
          </span>
        </button>

        {/* AR Mode Button */}
        <button
          onClick={handleARModeClick}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md rounded-xl p-4 flex flex-col items-center w-48 hover:scale-105 transition-transform"
        >
          <div className="w-24 h-24 rounded-md flex items-center justify-center overflow-hidden">
            <img
              src="/images/AugMode.png" // <-- palitan mo ng image file path mo
              alt="AR Mode"
              className="object-contain w-full h-full"
            />
          </div>
          <span className="mt-2 font-semibold text-center">
            Interact with AR Mode
          </span>
        </button>
      </div>
    </div>
  );
};

export default Page5;
