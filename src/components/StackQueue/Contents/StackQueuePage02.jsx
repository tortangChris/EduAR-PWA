import React from "react";

const StackQueuePage02 = () => {
  return (
    <div className="bg-base-200 rounded-xl shadow-md p-6 space-y-4 text-left">
      <h1 className="text-2xl font-bold">Stack Operations & Complexity</h1>

      <ul className="list-disc list-inside space-y-2">
        <li>
          <strong>Push (Add):</strong> O(1) – place item on top.
        </li>
        <li>
          <strong>Pop (Remove):</strong> O(1) – remove top item.
        </li>
        <li>
          <strong>Peek (View Top):</strong> O(1).
        </li>
        <li>
          Stacks do <strong>not allow random access</strong> (unlike arrays).
        </li>
      </ul>

      {/* <div className="bg-gray-900 text-gray-100 font-mono p-4 rounded-lg">
        <p className="font-semibold mb-2">Example</p>
        <pre className="whitespace-pre-wrap">
          {`Stack: [Bottom] 10, 20, 30 [Top]
Push 40 → [Bottom] 10, 20, 30, 40 [Top]
Pop → removes 40`}
        </pre>
      </div>

      <h3 className="text-lg font-semibold">🎨 3D Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>Animation: new block slides on top (push).</li>
        <li>Top block vanishes when popped.</li>
      </ul>

      <h3 className="text-lg font-semibold">🌐 AR Visual</h3>
      <ul className="list-disc list-inside ml-4 space-y-1">
        <li>User performs gestures:</li>
        <ul className="list-disc list-inside ml-6 space-y-1">
          <li>Swipe up → push new box.</li>
          <li>Tap top box → pop it.</li>
        </ul>
      </ul> */}
    </div>
  );
};

export default StackQueuePage02;
