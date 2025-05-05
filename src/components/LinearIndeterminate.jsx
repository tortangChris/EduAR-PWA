import React from 'react';

const LinearIndeterminate = () => (
  <>
    <div className="relative w-full h-2 bg-gray-200 overflow-hidden rounded">
      <div className="indeterminate-bar absolute h-full bg-blue-500 rounded"></div>
    </div>
    <style>
      {`
        @keyframes indeterminate {
          0% {
            left: -40%;
            width: 40%;
          }
          100% {
            left: 100%;
            width: 40%;
          }
        }

        .indeterminate-bar {
          animation: indeterminate 1.2s infinite ease-out;
        }
      `}
    </style>
  </>
);

export default LinearIndeterminate;
