import React from "react";

const ProgressBar = ({ progress }) => {
  return (
    <div className="mb-4">
      <p className="text-sm text-center mb-2 font-medium">
        Progress: {progress}%
      </p>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
