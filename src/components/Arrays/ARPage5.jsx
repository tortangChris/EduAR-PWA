// ARPage5.jsx
import React, { useEffect, useRef, useState } from "react";
import { ARCanvas } from "@react-three/xr";
import { Text } from "@react-three/drei";

const ARPage5 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 0.25,
  deleteIndex = 2,
}) => {
  const originalRef = useRef(data.slice());
  const [boxes, setBoxes] = useState([]);
  const [status, setStatus] = useState("Idle");
  const animRef = useRef({ cancelled: false });

  // helper to create array of boxes with positions
  const createBoxes = (arr) => {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((v, i) => ({
      id: `b${i}`,
      value: v,
      x: (i - mid) * spacing,
      opacity: 1,
    }));
  };

  useEffect(() => {
    setBoxes(createBoxes(originalRef.current));
    let loop = true;

    const runSequence = async () => {
      while (loop) {
        setBoxes(createBoxes(originalRef.current));
        setStatus(`Deleting element at index ${deleteIndex}...`);

        // wait 2s
        await delay(2000);

        // fade out deleted element
        setBoxes((prev) =>
          prev.map((b, i) => (i === deleteIndex ? { ...b, opacity: 0 } : b))
        );
        setStatus(`Element ${originalRef.current[deleteIndex]} removed`);
        await delay(2000);

        // shift elements after deleteIndex
        for (let i = deleteIndex + 1; i < originalRef.current.length; i++) {
          setStatus(`Shifting element at index ${i} left...`);
          setBoxes((prev) =>
            prev.map((b, j) => (j === i ? { ...b, x: b.x - spacing } : b))
          );
          await delay(2000);
        }

        // finalize
        const newArr = originalRef.current.slice();
        newArr.splice(deleteIndex, 1);
        setBoxes(createBoxes(newArr));
        setStatus("✅ Deletion complete");

        // wait 3s before loop reset
        await delay(3000);
      }
    };

    runSequence();

    return () => {
      loop = false;
      animRef.current.cancelled = true;
    };
  }, [deleteIndex]);

  return (
    <div className="w-full h-screen">
      <ARCanvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 5, 2]} intensity={0.8} />

        {/* Status text floating above */}
        <Text
          position={[0, 0.5, -1]}
          fontSize={0.08}
          anchorX="center"
          anchorY="middle"
        >
          {status}
        </Text>

        {/* Render boxes */}
        {boxes.map((b, i) => (
          <Box
            key={b.id}
            value={b.value}
            index={i}
            position={[b.x, 0, -1]}
            opacity={b.opacity}
          />
        ))}
      </ARCanvas>
    </div>
  );
};

const Box = ({ value, index, position, opacity = 1 }) => {
  const size = [0.18, 0.12, 0.1];
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={opacity} />
      </mesh>

      {/* Value */}
      <Text
        position={[0, 0.1, 0.06]}
        fontSize={0.05}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        {value}
      </Text>

      {/* Index */}
      <Text
        position={[0, -0.05, 0.06]}
        fontSize={0.04}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        [{index}]
      </Text>
    </group>
  );
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default ARPage5;
