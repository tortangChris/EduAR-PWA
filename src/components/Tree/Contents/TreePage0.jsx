import React from "react";

const TreePage0 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Tree Data Structure</h1>
      <hr className="my-2" />

      <h2 className="text-xl font-semibold">🔹 Progression Flow</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Total Pages:</strong> 7 (6 content + 1 assessment).
        </li>
        <li>
          <strong>Progress:</strong> User must finish each page.
        </li>
        <li>
          <strong>Unlock next module:</strong> Passed the Assessment → module
          marked complete → then{" "}
          <strong>Module 6 (Graph Data Structure and Operations)</strong>{" "}
          unlocks.
        </li>
      </ul>
    </div>
  );
};

export default TreePage0;
