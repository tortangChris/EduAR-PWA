import React from "react";

const GraphPage03 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Graph Traversals</h1>
      <hr className="my-2 border-gray-300" />

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Depth-First Search (DFS):</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Explore as far as possible along each branch before backtracking.
            </li>
            <li>Implemented via recursion/stack.</li>
          </ul>
        </li>
        <li>
          <strong>Breadth-First Search (BFS):</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Explore neighbors level by level.</li>
            <li>Implemented via queue.</li>
          </ul>
        </li>
      </ul>

      <p>
        <strong>Complexity:</strong> O(V + E) where V = vertices, E = edges.
      </p>

      <p className="font-semibold">Use Cases:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>DFS → topological sorting, solving puzzles.</li>
        <li>BFS → shortest path in unweighted graphs.</li>
      </ul>
    </div>
  );
};

export default GraphPage03;
