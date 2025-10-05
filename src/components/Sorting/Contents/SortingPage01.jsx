import React from "react";

const SortingPage01 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Sorting</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Sorting</strong> = process of arranging elements in a specific
          order (ascending or descending).
        </li>
        <li>
          <strong>Importance:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>Easier searching (binary search requires sorted data).</li>
            <li>Better organization of data.</li>
            <li>
              Common in real-world (ranking, leaderboards, database queries).
            </li>
          </ul>
        </li>
        <li>
          Two major categories:
          <ol className="list-decimal list-inside ml-6 space-y-1">
            <li>
              <strong>Simple/Quadratic Sorts</strong> (Bubble, Insertion,
              Selection).
            </li>
            <li>
              <strong>Efficient Sorts</strong> (Merge, Quick, Heap).
            </li>
          </ol>
        </li>
      </ul>
    </div>
  );
};

export default SortingPage01;
