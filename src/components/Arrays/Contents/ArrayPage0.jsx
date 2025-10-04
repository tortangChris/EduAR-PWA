import React from "react";

const ArrayPage0 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">
        Module 1: Arrays &amp; Time Complexity
      </h1>
      <hr className="my-2 border-gray-300" />

      <h2 className="text-lg font-semibold">🔹 Progression Flow</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <strong>Total Pages:</strong> 7 (6 content + 1 assessment).
        </li>
        <li>
          <strong>Progress:</strong> User must finish each page.
        </li>
        <li>
          <strong>Unlock next module:</strong> Passed the Assessment → module
          marked complete → then <strong>Module 2 (Sorting Algorithms)</strong>{" "}
          unlocks.
        </li>
      </ul>
    </div>
  );
};

export default ArrayPage0;
