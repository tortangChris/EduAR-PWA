import React from "react";

const GraphPage04 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Shortest Path Algorithms</h1>
      <hr className="my-2 border-gray-300" />

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Dijkstra’s Algorithm:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Finds shortest path in weighted graph with non-negative weights.
            </li>
            <li>Complexity: O(V²) or O((V+E) log V) with priority queue.</li>
          </ul>
        </li>
        <li>
          <strong>Bellman-Ford Algorithm:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Handles negative weights, slower (O(VE)).</li>
          </ul>
        </li>
        <li>
          <strong>Floyd-Warshall Algorithm:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Finds all-pairs shortest paths, O(V³).</li>
          </ul>
        </li>
      </ul>

      <p className="font-semibold">Applications:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>GPS navigation</li>
        <li>Routing in networks</li>
        <li>Game AI movement</li>
      </ul>
    </div>
  );
};

export default GraphPage04;
