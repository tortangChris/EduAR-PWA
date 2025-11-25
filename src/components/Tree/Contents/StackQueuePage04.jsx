import React from "react";

const StackQueuePage04 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Queue Operations & Complexity</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Enqueue (Add):</strong> O(1) – place item at rear.
        </li>
        <li>
          <strong>Dequeue (Remove):</strong> O(1) – remove item from front.
        </li>
        <li>
          <strong>Peek (View Front):</strong> O(1).
        </li>
        <li>Queues process elements in the order they arrive.</li>
      </ul>

      {/* <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-lg">
        <p className="font-semibold mb-2">Example</p>
        <pre className="whitespace-pre-wrap">
          {`Queue: [Front] 10, 20, 30 [Rear]
Enqueue 40 → [Front] 10, 20, 30, 40 [Rear]
Dequeue → removes 10`}
        </pre>
      </div>

      <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Animation: new box joins from the right.</li>
        <li>Leftmost box exits smoothly.</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Student taps rear → new element enqueued.</li>
        <li>Student taps front → element dequeued.</li>
      </ul> */}
    </div>
  );
};

export default StackQueuePage04;
