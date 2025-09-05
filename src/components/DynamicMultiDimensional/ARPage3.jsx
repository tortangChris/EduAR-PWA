import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage3 = ({
  rows = 3,
  cols = 4,
  spacing = 2.0,
  stepDuration = 700,
}) => {
  const initialMatrix = useRef(
    Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => r * cols + c + 1)
    )
  );
  const [boxes, setBoxes] = useState(
    createGridBoxes(initialMatrix.current, spacing)
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [loopTrigger, setLoopTrigger] = useState(0);

  // helper: make grid
  function createGridBoxes(matrix, spacingVal) {
    const nRows = matrix.length;
    const nCols = matrix[0].length;
    const midY = (nRows - 1) / 2;
    const midX = (nCols - 1) / 2;

    return matrix.flatMap((row, r) =>
      row.map((value, c) => ({
        id: `b${r}-${c}`,
        value,
        row: r,
        col: c,
        position: [(c - midX) * spacingVal, (midY - r) * spacingVal, 0],
        highlight: false,
      }))
    );
  }

  // automatic animation sequence
  useEffect(() => {
    let cancelled = false;

    const runSequence = async () => {
      setStatus("Starting grid...");
      setBoxes(createGridBoxes(initialMatrix.current, spacing));
      await wait(1500);

      // highlight bawat cell isa-isa
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (cancelled) return;
          await highlightElement(r, c);
          await wait(500); // pause between cells
        }
      }

      setStatus("Resetting...");
      await wait(2000);

      if (!cancelled) {
        setLoopTrigger((t) => t + 1); // loop ulit
      }
    };

    runSequence();
    return () => {
      cancelled = true;
    };
  }, [loopTrigger]);

  // highlight effect
  const highlightElement = async (rowIndex, colIndex) => {
    setStatus(`Highlighting element at [${rowIndex}][${colIndex}]`);
    const totalSteps = 20;
    for (let step = 0; step <= totalSteps; step++) {
      setBoxes((prev) =>
        prev.map((b) => ({
          ...b,
          highlight:
            b.row === rowIndex && b.col === colIndex
              ? step < totalSteps / 2
              : false,
        }))
      );
      setProgress(Math.round((step / totalSteps) * 100));
      await wait(stepDuration / totalSteps);
    }
  };

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));

  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center">
      <div className="w-2/3 mb-4">
        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-300 rounded">
          <div
            className="h-2 bg-green-500 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="mt-2 text-gray-700 font-mono text-sm text-center">
          {status}
        </div>
      </div>
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [8, 0, 12], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {/* Boxes */}
          {boxes.map((b) => (
            <Box
              key={b.id}
              value={b.value}
              position={b.position}
              highlight={b.highlight}
            />
          ))}

          {/* Row labels */}
          {Array.from({ length: rows }).map((_, r) => (
            <Text
              key={`row-label-${r}`}
              position={[
                -spacing * 2.5,
                ((rows - 1) / 2) * spacing - r * spacing,
                0,
              ]}
              fontSize={0.3}
              anchorX="center"
              anchorY="middle"
              color="#000000"
            >
              Row {r}
            </Text>
          ))}

          {/* Column labels */}
          {Array.from({ length: cols }).map((_, c) => (
            <Text
              key={`col-label-${c}`}
              position={[(c - (cols - 1) / 2) * spacing, spacing * 2.0, 0]}
              fontSize={0.3}
              anchorX="center"
              anchorY="middle"
              color="#000000"
            >
              Col {c}
            </Text>
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ value, position, highlight }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={highlight ? "#f59e0b" : "#60a5fa"} />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
      >
        {value}
      </Text>
    </group>
  );
};

export default VisualPage3;
