import React from "react";

const TreePage02 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Basic Terminology</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Root:</strong> First/top node of the tree.
        </li>
        <li>
          <strong>Parent & Child:</strong> Relationship between connected nodes.
        </li>
        <li>
          <strong>Siblings:</strong> Children of the same parent.
        </li>
        <li>
          <strong>Leaf Node:</strong> Node with no children.
        </li>
        <li>
          <strong>Height of Tree:</strong> Longest path from root to a leaf.
        </li>
        <li>
          <strong>Depth of Node:</strong> Distance from root to that node.
        </li>
      </ul>
    </div>
  );
};

export default TreePage02;
