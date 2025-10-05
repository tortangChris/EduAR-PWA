import React from "react";

const LinkedListPage02 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Singly Linked List</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Definition:</strong> Each node points to the{" "}
          <strong>next</strong> node only.
        </li>
        <li>
          Traversal is <strong>one-directional</strong> (from head → tail).
        </li>

        <li>
          <strong>Operations:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Insert at Head/Tail:</strong> O(1) at head, O(n) at tail.
            </li>
            <li>
              <strong>Search:</strong> O(n).
            </li>
            <li>
              <strong>Delete:</strong> O(n) (need to find previous node).
            </li>
          </ul>
        </li>

        {/* <li>
          <strong>Example:</strong>
          <pre className="bg-gray-900 text-white rounded-md p-3 mt-2 overflow-auto">
            {`Head → [10|Next] → [20|Next] → [30|Next] → NULL`}
          </pre>
        </li> */}
      </ul>
    </div>
  );
};

export default LinkedListPage02;
