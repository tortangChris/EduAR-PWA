import React from "react";

const GraphPage02 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Graph Representation</h1>
      <hr className="my-2 border-gray-300" />

      <ol className="list-decimal pl-6 space-y-3">
        <li>
          <strong>Adjacency Matrix:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>2D array, matrix[i][j] = 1 if edge exists, else 0.</li>
            <li>
              <strong>Pros:</strong> simple, fast edge lookup.
            </li>
            <li>
              <strong>Cons:</strong> uses O(V²) space.
            </li>
          </ul>
        </li>

        <li>
          <strong>Adjacency List:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Each vertex stores list of connected vertices.</li>
            <li>
              <strong>Pros:</strong> efficient for sparse graphs.
            </li>
            <li>
              <strong>Cons:</strong> slower for direct edge lookup.
            </li>
          </ul>
        </li>
      </ol>
    </div>
  );
};

export default GraphPage02;
