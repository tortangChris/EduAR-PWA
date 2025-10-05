import React from "react";

const TreePage01 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Trees</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          A <strong>Tree</strong> is a{" "}
          <strong>non-linear hierarchical data structure</strong>.
        </li>
        <li>
          Consists of <strong>nodes</strong> connected by edges.
        </li>
        <li>
          Topmost node = <strong>Root</strong>.
        </li>
        <li>
          Nodes may have <strong>children</strong>, <strong>siblings</strong>,
          or be <strong>leaf nodes</strong> (no children).
        </li>
        <li>
          <strong>Use cases:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>File systems</li>
            <li>Organization charts</li>
            <li>Parsing expressions</li>
            <li>Databases and indexing</li>
          </ul>
        </li>
      </ul>

      <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <p>Tree diagram: root at top, branches connecting to children.</p>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <p>
        Floating hierarchical nodes in AR, user can tap to expand/collapse
        subtrees.
      </p>
    </div>
  );
};

export default TreePage01;
