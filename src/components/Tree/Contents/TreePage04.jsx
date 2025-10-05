import React from "react";

const TreePage04 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Binary Search Tree (BST)</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Definition:</strong> A binary tree with ordering property:
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>Left subtree has smaller values.</li>
            <li>Right subtree has larger values.</li>
          </ul>
        </li>
        <li>
          <strong>Operations:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Insertion:</strong> Place node in correct position based
              on value.
            </li>
            <li>
              <strong>Search:</strong> Traverse left/right depending on value.
            </li>
            <li>
              <strong>Deletion:</strong> Remove node and restructure tree.
            </li>
          </ul>
        </li>
      </ul>

      <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <p>BST animation inserting nodes: 10 → 5 → 15 → 7.</p>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <p>User drags a value into the tree, system places it automatically.</p>
    </div>
  );
};

export default TreePage04;
