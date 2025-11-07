import React from "react";

const TreePage03 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Types of Trees</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>General Tree:</strong> No restriction on number of children.
        </li>
        <li>
          <strong>Binary Tree:</strong> Each node has ≤ 2 children.
        </li>
        <li>
          <strong>Full Binary Tree:</strong> Every node has 0 or 2 children.
        </li>
        <li>
          <strong>Complete Binary Tree:</strong> All levels filled except
          possibly the last, filled left to right.
        </li>
        <li>
          <strong>Binary Search Tree (BST):</strong> Left child &lt; root &lt;
          right child.
        </li>
      </ul>
    </div>
  );
};

export default TreePage03;
