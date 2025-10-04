import React from "react";

const ArrayPage02 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Access Operation (O(1))</h1>

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Access</strong> = retrieving an element directly using its{" "}
          <strong>index</strong>.
        </li>
        <li>
          Arrays support <strong>direct access</strong> because their memory
          addresses are sequential.
        </li>
        <li>
          <strong>Time Complexity:</strong>{" "}
          <code className="bg-gray-500 px-1 rounded">O(1)</code> →{" "}
          <strong>constant time</strong>, regardless of array size.
        </li>
      </ul>

      {/* <div>
        <h2 className="text-xl font-semibold">Example</h2>
        <pre className="bg-gray-900 text-white p-3 rounded-lg overflow-x-auto">
          {`arr = [10, 20, 30, 40]
arr[2] = 30   # Accessing element at index 2`}
        </pre>
      </div> */}
    </div>
  );
};

export default ArrayPage02;
