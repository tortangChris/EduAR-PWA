import React from "react";

const ArrayPage05 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Deletion (O(n))</h1>

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Deletion</strong> = removing an element from the array.
        </li>
        <li>
          All elements <strong>to the right</strong> of the deleted index must{" "}
          <strong>shift left</strong> to fill the gap.
        </li>
        <li>
          <strong>Worst-case Time Complexity:</strong>{" "}
          <code className="bg-gray-500 px-1 rounded">O(n)</code> (when deleting
          at the beginning or middle).
        </li>
      </ul>

      {/* <div>
        <h2 className="text-xl font-semibold">Example</h2>
        <pre className="bg-gray-900 text-white p-3 rounded-lg overflow-x-auto">
          {`arr = [10, 20, 30, 40]
Delete element at index 2:
→ [10, 20, 40]`}
        </pre>
      </div> */}
    </div>
  );
};

export default ArrayPage05;
