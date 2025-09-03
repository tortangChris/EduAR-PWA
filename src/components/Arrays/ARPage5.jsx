import React, { useState, useEffect, useMemo } from "react";
import { ARCanvas } from "@react-three/xr";
import { Text } from "@react-three/drei";

const VisualPage5 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  deleteIndex = 2,
}) => {
  const [boxes, setBoxes] = useState([]);
  const [status, setStatus] = useState("Idle");
  const [loop, setLoop] = useState(0);

  // positions
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing, loop]);

  useEffect(() => {
    let isCancelled = false;

    const runDemo = async () => {
      while (!isCancelled) {
        // reset
        setBoxes(
          data.map((v, i) => ({
            id: i,
            value: v,
            x: positions[i][0],
            opacity: 1,
          }))
        );
        setStatus(`Delete operation: removing index ${deleteIndex}`);
        await delay(2000);

        // fade out target
        setStatus(`Fading out value ${data[deleteIndex]}...`);
        setBoxes((prev) =>
          prev.map((b, i) => (i === deleteIndex ? { ...b, opacity: 0.2 } : b))
        );
        await delay(2000);

        // shift left elements after deleteIndex
        for (let i = deleteIndex + 1; i < data.length; i++) {
          if (isCancelled) return;
          setStatus(`Shifting value ${data[i]} from index ${i} → ${i - 1}`);
          setBoxes((prev) =>
            prev.map((b) => (b.id === i ? { ...b, x: positions[i - 1][0] } : b))
          );
          await delay(2000);
        }

        // finalize deletion
        const newArr = data.slice();
        newArr.splice(deleteIndex, 1);
        setStatus("✅ Deletion complete!");
        setBoxes(
          newArr.map((v, i) => ({
            id: i,
            value: v,
            x: (i - (newArr.length - 1) / 2) * spacing,
            opacity: 1,
          }))
        );
        await delay(3000);

        setLoop((prev) => prev + 1);
      }
    };

    runDemo();

    return () => {
      isCancelled = true;
    };
  }, [data, spacing, deleteIndex]);

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center">
      <div className="text-center text-lg font-mono mb-4">{status}</div>
      <ARCanvas>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {boxes.map((b, i) => (
          <Box
            key={b.id}
            value={b.value}
            index={i}
            position={[b.x, 0, 0]}
            opacity={b.opacity}
          />
        ))}
      </ARCanvas>
    </div>
  );
};

const Box = ({ value, index, position, opacity = 1 }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" transparent opacity={opacity} />
      </mesh>
      {/* Value */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        {value}
      </Text>
      {/* Index */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        [{index}]
      </Text>
    </group>
  );
};

// helper delay
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export default VisualPage5;
