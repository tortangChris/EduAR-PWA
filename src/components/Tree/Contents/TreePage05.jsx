import React from "react";

const TreePage05 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Tree Traversals</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Traversal:</strong> Visiting all nodes in a tree.
        </li>
        <li>
          <strong>Depth-First Traversals:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Preorder:</strong> Root → Left → Right
            </li>
            <li>
              <strong>Inorder:</strong> Left → Root → Right
            </li>
            <li>
              <strong>Postorder:</strong> Left → Right → Root
            </li>
          </ul>
        </li>
        <li>
          <strong>Breadth-First Traversal (Level Order):</strong> Visit nodes
          level by level.
        </li>
      </ul>

      <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <p>Animation showing preorder, inorder, postorder paths.</p>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <p>User taps traversal type → nodes light up in that visiting order.</p>
    </div>
  );
};

export default TreePage05;
