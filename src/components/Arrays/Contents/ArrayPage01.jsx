import React from "react";

const ArrayPage01 = () => {
  return (
    <div className="space-y-4 text-left">
      <h1 className="text-2xl font-bold">Introduction to Arrays</h1>

      <p>
        An <strong>array</strong> is a{" "}
        <strong>linear collection of elements</strong> stored in{" "}
        <strong>contiguous memory locations</strong>. This means that all the
        elements are placed next to each other in memory, making it easy to
        calculate the address of any element directly.
      </p>

      {/* <div>
        <h2 className="text-xl font-semibold">Example</h2>
        <pre className="bg-gray-900 text-white p-3 rounded-lg overflow-x-auto">
          {`[10, 20, 30, 40]
Index:  0   1   2   3`}
        </pre>
      </div> */}

      <div>
        <h2 className="text-xl font-semibold">Use Cases</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Storing lists of numbers, strings, or objects.</li>
          <li>Representing tables (2D arrays).</li>
          <li>
            Useful in algorithms, data processing, and memory-efficient
            structures.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ArrayPage01;
