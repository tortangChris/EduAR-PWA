import React from "react";

const ArrayPage03 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Search Operation (O(n))</h1>

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Searching</strong> means looking for an element in the array.
        </li>
        <li>
          <strong>Linear Search:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Start from index <code>0</code>.
            </li>
            <li>
              Check each element one by one until found or until the end of the
              array.
            </li>
          </ul>
        </li>
        <li>
          <strong>Worst-case:</strong> The element might be at the last position
          (or not present at all).
        </li>
        <li>
          <strong>Time Complexity:</strong>{" "}
          <code className="bg-gray-500 px-1 rounded">O(n)</code> → proportional
          to the size of the array.
        </li>
      </ul>

      {/* <div>
        <h2 className="text-xl font-semibold">Example</h2>
        <pre className="bg-gray-900 text-white p-3 rounded-lg overflow-x-auto">
          {`arr = [10, 20, 30, 40]
Search 30 → Found at index 2 after checking 3 elements`}
        </pre>
      </div> */}
    </div>
  );
};

export default ArrayPage03;
