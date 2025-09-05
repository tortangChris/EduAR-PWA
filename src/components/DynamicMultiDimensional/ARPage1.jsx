// ARPage1.jsx
import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { ARButton, Text } from "@react-three/drei";

const ARPage1 = ({
  data = [10, 20, 30, 40],
  spacing = 2.0,
  stepDuration = 1500,
  extraSpace = 2,
  loopDelay = 3000,
}) => {
  const initialData = useRef(data.slice());
  const [boxes, setBoxes] = useState(() =>
    createBoxes(
      initialData.current,
      initialData.current.length + extraSpace,
      spacing
    )
  );
  const animRef = useRef({ cancelled: false });
  const [status, setStatus] = useState("");

  // Create slots (array with capacity)
  function createBoxes(arr, capacityVal, spacingVal) {
    const n = capacityVal;
    const mid = (n - 1) / 2;
    return Array.from({ length: n }).map((_, i) => ({
      id: `b${i}`,
      value: i < arr.length ? arr[i] : null,
      x: (i - mid) * spacingVal,
      opacity: i < arr.length ? 1 : 0.2,
    }));
  }

  // Reset to starting array
  const resetToStart = () => {
    animRef.current.cancelled = true;
    setBoxes(
      createBoxes(
        initialData.current,
        initialData.current.length + extraSpace,
        spacing
      )
    );
    setStatus("Idle...");
  };

  // Append animation (auto-play)
  const animateAppendWithExtra = async () => {
    animRef.current.cancelled = false;

    let currentArr = initialData.current.slice();
    setBoxes(createBoxes(currentArr, currentArr.length + extraSpace, spacing));
    setStatus("📦 Appending values...");

    const valuesToAdd = [50, 60];

    for (let v = 0; v < valuesToAdd.length; v++) {
      if (animRef.current.cancelled) break;
      await new Promise((res) => setTimeout(res, stepDuration));
      currentArr.push(valuesToAdd[v]);
      setBoxes(
        createBoxes(currentArr, currentArr.length + extraSpace, spacing)
      );
      setStatus(`✅ Added ${valuesToAdd[v]} at index ${currentArr.length - 1}`);
    }

    // wait before reset
    await new Promise((res) => setTimeout(res, loopDelay));
    resetToStart();

    // wait again then restart loop
    await new Promise((res) => setTimeout(res, 1000));
    animateAppendWithExtra();
  };

  // Auto start on mount
  useEffect(() => {
    animateAppendWithExtra();
    return () => {
      animRef.current.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center">
      {/* ARButton to toggle AR mode */}
      <ARButton />

      {/* Overlay text status */}
      <div className="absolute top-4 w-full text-center">
        <p className="text-gray-800 font-mono text-lg bg-white/80 px-3 py-1 rounded-lg inline-block shadow">
          {status}
        </p>
      </div>

      {/* 3D AR Scene */}
      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 50 }}
        gl={{ xrCompatible: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {boxes.map((b, i) => (
          <Box
            key={b.id}
            value={b.value}
            index={i}
            position={[b.x, 0, -2]} // in front of user
            opacity={b.opacity}
          />
        ))}
      </Canvas>
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
      {value !== null && (
        <>
          <Text
            position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
            fontSize={0.35}
            anchorX="center"
            anchorY="middle"
            color="#ffffff"
          >
            {value}
          </Text>
          <Text
            position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
            fontSize={0.2}
            anchorX="center"
            anchorY="middle"
            color="#ffffff"
          >
            [{index}]
          </Text>
        </>
      )}
    </group>
  );
};

export default ARPage1;
