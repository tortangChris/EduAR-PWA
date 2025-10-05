import React from "react";

const LinkedListPage04 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Circular Linked List</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Definition:</strong> Last node points back to the{" "}
          <strong>head</strong>, forming a loop.
        </li>
        <li>
          Can be <strong>singly circular</strong> (only Next points in loop) or{" "}
          <strong>doubly circular</strong>.
        </li>
        <li>
          <strong>Use Case:</strong> Useful in scenarios requiring continuous
          traversal (e.g., round-robin scheduling).
        </li>
        {/* <li>
          <strong>Example:</strong>
          <pre className="bg-gray-900 text-white rounded-md p-3 mt-2 overflow-auto">
            {`[10|Next] → [20|Next] → [30|Next]
       ↑________________________↓`}
          </pre>
        </li> */}
      </ul>

      {/* <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Boxes arranged in a circle with arrows looping.</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>User rotates around the loop to see the circular link.</li>
      </ul> */}
    </div>
  );
};

export default LinkedListPage04;
