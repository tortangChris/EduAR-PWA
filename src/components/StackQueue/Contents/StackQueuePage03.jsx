import React from "react";

const StackQueuePage03 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Queues</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          A <strong>Queue</strong> is a <strong>linear data structure</strong>{" "}
          that follows the <strong>FIFO principle</strong>:{" "}
          <em>First In, First Out</em> → the earliest element added is the first
          removed.
        </li>

        <li>
          <strong>Common operations:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Enqueue:</strong> Add element at the rear.
            </li>
            <li>
              <strong>Dequeue:</strong> Remove element from the front.
            </li>
          </ul>
        </li>

        <li>
          <strong>Real-Life Analogy:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              A line at the ticket counter → first person in line gets served
              first.
            </li>
          </ul>
        </li>
      </ul>

      {/* <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>A horizontal row of boxes (like people in line).</li>
        <li>Leftmost box = "front". Rightmost box = "rear".</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Floating row in AR space.</li>
        <li>New box slides in from right (enqueue).</li>
        <li>Leftmost box slides out (dequeue).</li>
      </ul> */}
    </div>
  );
};

export default StackQueuePage03;
