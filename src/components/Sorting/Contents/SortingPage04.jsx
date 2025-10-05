import React from "react";

const SortingPage04 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Selection Sort (O(n²))</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Idea:</strong> Repeatedly select the smallest (or largest)
          element and place it at the front.
        </li>
        <li>
          <strong>Time Complexity:</strong> Always O(n²).
        </li>
        <li>
          <strong>Example:</strong>
          <pre className="bg-gray-900 text-white p-3 rounded-lg mt-2">
            {`[7, 4, 5, 2]
 → [2, 4, 5, 7]`}
          </pre>
        </li>
      </ul>
    </div>
  );
};

export default SortingPage04;
