import React from "react";

const GraphPage01 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Graphs</h1>
      <hr className="my-2 border-gray-300" />

      <ul className="list-disc pl-6 space-y-2">
        <li>
          A <strong>Graph</strong> is a{" "}
          <strong>non-linear data structure</strong> made of:
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Vertices (nodes)</strong> → represent entities.
            </li>
            <li>
              <strong>Edges</strong> → represent relationships between entities.
            </li>
          </ul>
        </li>
        <li>
          <strong>Types of Graphs:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Undirected graph:</strong> edges have no direction.
            </li>
            <li>
              <strong>Directed graph (digraph):</strong> edges have direction.
            </li>
            <li>
              <strong>Weighted graph:</strong> edges carry weights (e.g.,
              distance, cost).
            </li>
          </ul>
        </li>
        <li>
          <strong>Real-life examples:</strong>
          <ul className="list-disc pl-6 space-y-1">
            <li>Social networks (people = nodes, friendships = edges).</li>
            <li>Maps (cities = nodes, roads = weighted edges).</li>
            <li>Computer networks.</li>
          </ul>
        </li>
      </ul>
    </div>
  );
};

export default GraphPage01;
