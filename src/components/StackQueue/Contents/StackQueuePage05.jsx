import React from "react";

const StackQueuePage05 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Variants of Stacks & Queues</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Stack Variants:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>Used in function calls (call stack).</li>
            <li>Undo feature in editors.</li>
          </ul>
        </li>

        <li>
          <strong>Queue Variants:</strong>
          <ul className="list-disc list-inside ml-6 space-y-1">
            <li>
              <strong>Circular Queue:</strong> Wraps around when full.
            </li>
            <li>
              <strong>Priority Queue:</strong> Elements dequeued by priority,
              not arrival time.
            </li>
            <li>
              <strong>Deque (Double-Ended Queue):</strong> Allows
              insertion/removal at both ends.
            </li>
          </ul>
        </li>
      </ul>

      {/* <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Circular queue shown as a loop of boxes.</li>
        <li>Priority queue: boxes with labels (high, low).</li>
        <li>Deque: arrows on both ends (insert/remove both sides).</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Student can rotate to view circular queue as a loop.</li>
        <li>Priority boxes float upward based on importance.</li>
        <li>Deque → arrows glow at both ends.</li>
      </ul> */}
    </div>
  );
};

export default StackQueuePage05;
