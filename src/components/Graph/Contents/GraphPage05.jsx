import React from "react";

const GraphPage05 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Advanced Graph Operations</h1>
      <hr className="my-2 border-gray-300" />

      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Minimum Spanning Tree (MST):</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              Subset of edges connecting all vertices with minimum weight.
            </li>
            <li>Algorithms: Kruskal’s, Prim’s.</li>
          </ul>
        </li>
        <li>
          <strong>Topological Sort:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ordering of vertices in a Directed Acyclic Graph (DAG).</li>
          </ul>
        </li>
        <li>
          <strong>Connected Components:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Group of vertices connected by paths.</li>
          </ul>
        </li>
      </ul>

      <p className="font-semibold">Applications:</p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Network design</li>
        <li>Project scheduling</li>
        <li>Clustering in data analysis</li>
      </ul>
    </div>
  );
};

export default GraphPage05;
