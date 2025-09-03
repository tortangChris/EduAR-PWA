import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const ARPage5 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  deleteIndex = 2,
  stepDuration = 700,
  loopDelay = 3000,
}) => {
  const originalRef = useRef(data.slice());
  const [boxes, setBoxes] = useState(() =>
    createBoxes(originalRef.current, spacing)
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("Idle");

  function createBoxes(arr, spacingVal) {
    const n = arr.length;
    const mid = (n - 1) / 2;
    return arr.map((v, i) => ({
      id: `b${i}`,
      value: v,
      x: (i - mid) * spacingVal,
      opacity: 1,
    }));
  }

  const reset = () => {
    animRef.current.cancelled = true;
    setBoxes(createBoxes(originalRef.current, spacing));
    setStatus("Idle");
  };

  const animateMove = (boxId, toX) => {
    return new Promise((resolve) => {
      const startX = boxes.find((b) => b.id === boxId).x;
      const duration = stepDuration;
      const startTime = performance.now();

      function frame(now) {
        if (animRef.current.cancelled) return resolve();
        const t = Math.min((now - startTime) / duration, 1);
        setBoxes((prev) =>
          prev.map((b) =>
            b.id === boxId ? { ...b, x: startX + (toX - startX) * t } : b
          )
        );
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }

      requestAnimationFrame(frame);
    });
  };

  const animateFadeOut = (boxId) => {
    return new Promise((resolve) => {
      const duration = stepDuration / 2;
      const startTime = performance.now();

      function frame(now) {
        if (animRef.current.cancelled) return resolve();
        const t = Math.min((now - startTime) / duration, 1);
        setBoxes((prev) =>
          prev.map((b) => (b.id === boxId ? { ...b, opacity: 1 - t } : b))
        );
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      }

      requestAnimationFrame(frame);
    });
  };

  // Main sequence — auto loop
  const playSequence = async () => {
    reset();
    animRef.current.cancelled = false;

    setStatus(`Deleting element at index ${deleteIndex}...`);
    const n = boxes.length;

    // Fade out target
    await animateFadeOut(`b${deleteIndex}`);
    setStatus(`Element at index ${deleteIndex} removed`);

    // Shift others
    for (let i = deleteIndex + 1; i < n; i++) {
      if (animRef.current.cancelled) break;
      const targetX = boxes[i].x - spacing;
      setStatus(`Shifting element at index ${i} left`);
      await animateMove(`b${i}`, targetX);
    }

    // Final state
    const newArr = originalRef.current.slice();
    newArr.splice(deleteIndex, 1);
    setBoxes(createBoxes(newArr, spacing));
    setStatus(`✅ Deletion complete`);

    // Wait then loop
    await new Promise((r) => setTimeout(r, loopDelay));
    playSequence();
  };

  useEffect(() => {
    playSequence();
    return () => {
      animRef.current.cancelled = true;
    };
  }, []);

  return (
    <div className="w-full h-[300px] bg-gray-50 flex flex-col items-center justify-center">
      {/* Status text */}
      <div className="mb-4 text-gray-700 font-mono text-sm text-center">
        {status}
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[60%]">
        <Canvas camera={{ position: [0, 4, 8], fov: 50 }}>
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
          <OrbitControls makeDefault />
        </Canvas>
      </div>
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
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color={`rgba(0,0,0,${opacity})`}
      >
        {value}
      </Text>
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

export default ARPage5;
