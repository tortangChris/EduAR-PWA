import React from "react";

const LinkedListPage01 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Linked Lists</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          A <strong>Linked List</strong> is a linear data structure where
          elements (<strong>nodes</strong>) are connected using{" "}
          <strong>pointers/references</strong>.
        </li>
        <li>
          Each <strong>node</strong> has two parts:
          <ol className="list-decimal list-inside ml-6 space-y-1">
            <li>
              <strong>Data</strong> (stores value).
            </li>
            <li>
              <strong>Pointer/Reference</strong> (points to next node).
            </li>
          </ol>
        </li>
        <li>
          Unlike arrays, linked lists do{" "}
          <strong>not use contiguous memory</strong>.
        </li>
        <li>
          <strong>Advantage:</strong> Dynamic memory allocation (can grow/shrink
          at runtime).
        </li>
        <li>
          <strong>Disadvantage:</strong> Slower access (must traverse nodes
          sequentially).
        </li>
      </ul>
    </div>
  );
};

export default LinkedListPage01;
