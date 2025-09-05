// AutoAppendPage.jsx
import React, { useRef, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const ARPage2 = ({
  data = [10, 20, 30, 40],
  spacing = 2.0,
  stepDuration = 700,
  extraSpace = 2,
  repeatDelay = 2000, // 2s delay after finish
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

  // Reset state
  const resetToStart = () => {
    animRef.current.cancelled = true;
    setBoxes(
      createBoxes(
        initialData.current,
        initialData.current.length + extraSpace,
        spacing
      )
    );
    setStatus("");
  };

  // Auto append animation loop
  const animateAppendWithExtra = async () => {
    animRef.current.cancelled = false;

    let currentArr = initialData.current.slice();
    setBoxes(createBoxes(currentArr, currentArr.length + extraSpace, spacing));
    setStatus("Appending values...");

    const valuesToAdd = [50, 60];

    for (let v = 0; v < valuesToAdd.length; v++) {
      if (animRef.current.cancelled) return;
      currentArr.push(valuesToAdd[v]);
      setBoxes(
        createBoxes(currentArr, currentArr.length + extraSpace, spacing)
      );
      setStatus(`Added ${valuesToAdd[v]} at index ${currentArr.length - 1}`);
      await new Promise((res) => setTimeout(res, stepDuration));
    }

    // wait 2s before restarting
    setStatus("Operation complete. Restarting...");
    await new Promise((res) => setTimeout(res, repeatDelay));

    if (!animRef.current.cancelled) {
      resetToStart();
      animateAppendWithExtra(); // loop
    }
  };

  // Run once on mount
  useEffect(() => {
    animateAppendWithExtra();
    return () => {
      animRef.current.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      <div className="w-2/3 mb-2 text-center">
        <div className="text-gray-800 font-mono text-sm">{status}</div>
      </div>
      <div className="w-full h-[75%]">
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
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

export default ARPage2;
