import React from "react";

const StackQueuePage01 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Stacks</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          A <strong>Stack</strong> is a <strong>linear data structure</strong>{" "}
          that follows the <strong>LIFO principle</strong>:{" "}
          <em>Last In, First Out</em> → the most recently added element is the
          first to be removed.
        </li>

        <li>
          <strong>Common operations:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Push:</strong> Add an element to the top.
            </li>
            <li>
              <strong>Pop:</strong> Remove the top element.
            </li>
            <li>
              <strong>Peek/Top:</strong> View the top element without removing
              it.
            </li>
          </ul>
        </li>

        <li>
          <strong>Real-Life Analogy:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              A stack of plates → last plate placed is the first one you take
              off.
            </li>
          </ul>
        </li>
      </ul>

      {/* <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>A vertical stack of boxes (like blocks).</li>
        <li>Top box highlighted → shows "last in" element.</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Floating vertical stack in AR space.</li>
        <li>User taps top box → it pops out.</li>
      </ul> */}
    </div>
  );
};

export default StackQueuePage01;
