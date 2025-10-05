import React from "react";

const SortingPage03 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Insertion Sort (O(n²))</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Idea:</strong> Build a sorted part of the array one element at
          a time. Insert each element into its correct position relative to the
          sorted part.
        </li>
        <li>
          <strong>Time Complexity:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>Best: O(n).</li>
            <li>Worst: O(n²).</li>
          </ul>
        </li>
        <li>
          <strong>Example:</strong>
          <pre className="bg-gray-900 text-white p-3 rounded-lg mt-2">
            {`[5, 2, 4, 6]
 → [2, 5, 4, 6]
 → [2, 4, 5, 6]
 → [2, 4, 5, 6]`}
          </pre>
        </li>
      </ul>
    </div>
  );
};

export default SortingPage03;
