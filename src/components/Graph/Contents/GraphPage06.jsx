import React from "react";

const GraphPage06 = () => {
  return (
    <div className="space-y-6 text-left">
      {/* Page 6 – Applications of Graphs */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Page 6 – Applications of Graphs</h1>
        <hr className="my-2 border-gray-300" />

        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Social Networks:</strong> model relationships.
          </li>
          <li>
            <strong>Maps &amp; GPS:</strong> shortest path, routing.
          </li>
          <li>
            <strong>Web Crawling:</strong> internet pages as graph.
          </li>
          <li>
            <strong>Recommendation Systems:</strong> graphs of user preferences.
          </li>
          <li>
            <strong>Network Flow:</strong> data packets in computer networks.
          </li>
        </ul>

        <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Social graph with friend connections.</li>
          <li>Map with shortest route animation.</li>
        </ul>

        <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>
            Floating social graph where user taps friend node to expand
            connections.
          </li>
        </ul>
      </div>

      <hr className="my-6 border-gray-400" />

      {/* Page 7 – Assessment */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Page 7 – Assessment</h1>
        <hr className="my-2 border-gray-300" />

        <h3 className="text-lg font-semibold">📝 Instructions</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Answer all questions.</li>
          <li>
            Must score <strong>at least 70%</strong> to unlock the next module.
          </li>
        </ul>

        <h3 className="text-lg font-semibold">📌 Sample Questions</h3>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Differentiate adjacency matrix vs adjacency list.</li>
          <li>What is the time complexity of BFS and DFS?</li>
          <li>Which shortest path algorithm works with negative weights?</li>
          <li>Define Minimum Spanning Tree.</li>
          <li>Give one real-world example where graphs are applied.</li>
        </ol>

        <div className="pt-4 font-semibold text-green-700">
          ✅ End of Module 8
        </div>
      </div>
    </div>
  );
};

export default GraphPage06;
