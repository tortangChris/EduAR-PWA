import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage1 = ({
  data = [10, 20, 30, 40],
  capacity = 6,
  spacing = 2.0,
}) => {
  const originalRef = useRef(data.slice());
  const [boxes, setBoxes] = useState(() =>
    createBoxes(originalRef.current, capacity, spacing)
  );

  function createBoxes(arr, capacityVal, spacingVal) {
    const n = capacityVal;
    const mid = (n - 1) / 2;
    return Array.from({ length: n }).map((_, i) => ({
      id: `b${i}`,
      value: i < arr.length ? arr[i] : null,
      x: (i - mid) * spacingVal,
      opacity: i < arr.length ? 1 : 0.2,
      isExtra: i >= arr.length,
    }));
  }

  return (
    <div className="w-full h-[300px] bg-gray-50 flex items-center justify-center">
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

export default VisualPage1;
