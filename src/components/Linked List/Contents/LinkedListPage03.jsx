import React from "react";

const LinkedListPage03 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Doubly Linked List</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Definition:</strong> Each node has{" "}
          <strong>two pointers</strong>:
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Prev</strong> → previous node.
            </li>
            <li>
              <strong>Next</strong> → next node.
            </li>
          </ul>
        </li>
        <li>
          Traversal can be <strong>forward</strong> or <strong>backward</strong>
          .
        </li>
        <li>
          <strong>Operations:</strong> Easier deletion/insertion at both ends.
        </li>
        {/* <li>
          <strong>Example:</strong>
          <pre className="bg-gray-900 text-white rounded-md p-3 mt-2 overflow-auto">
            {`NULL ← [10|Prev,Next] ⇄ [20|Prev,Next] ⇄ [30|Prev,Next] → NULL`}
          </pre>
        </li> */}
      </ul>

      {/* <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Boxes with arrows pointing both left and right.</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>
          User taps left/right arrows to navigate nodes in both directions.
        </li>
      </ul> */}
    </div>
  );
};

export default LinkedListPage03;
