import React from "react";

const ArrayPage04 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Insertion (O(n))</h1>

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Insertion</strong> = adding a new element into the array.
        </li>
        <li>
          If inserting <strong>in the middle</strong>, elements{" "}
          <strong>to the right must shift one position</strong> to make space.
        </li>
        <li>
          <strong>Worst-case Time Complexity:</strong>{" "}
          <code className="bg-gray-500 px-1 rounded">O(n)</code> (when inserting
          at the beginning or middle).
        </li>
      </ul>

      {/* <div>
        <h2 className="text-xl font-semibold">Example</h2>
        <pre className="bg-gray-900 text-white p-3 rounded-lg overflow-x-auto">
          {`arr = [10, 20, 30, 40]
Insert 99 at index 2:
→ [10, 20, 99, 30, 40]`}
        </pre>
      </div> */}
    </div>
  );
};

export default ArrayPage04;
