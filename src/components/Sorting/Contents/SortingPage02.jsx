import React from "react";

const SortingPage02 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Bubble Sort (O(n²))</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Idea:</strong> Repeatedly compare adjacent elements and swap
          if out of order.
        </li>
        <li>
          <strong>Time Complexity:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>Best: O(n) (already sorted).</li>
            <li>Worst: O(n²).</li>
          </ul>
        </li>
        <li>
          <strong>Example (Ascending):</strong>
          <pre className="bg-gray-900 text-white p-3 rounded-lg mt-2">
            {`[5, 3, 8, 4]
 → [3, 5, 4, 8]
 → [3, 4, 5, 8]`}
          </pre>
        </li>
      </ul>
    </div>
  );
};

export default SortingPage02;
