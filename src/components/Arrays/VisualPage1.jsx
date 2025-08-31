// VisualPage1.jsx
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  // positions for boxes along the X axis
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <div className="w-full  h-[300px]">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Row of boxes */}
        {data.map((value, i) => (
          <Box key={i} index={i} value={value} position={positions[i]} />
        ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

const Box = ({ index, value, position = [0, 0, 0] }) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      {/* Box */}
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={index % 2 === 0 ? "#60a5fa" : "#34d399"} />
      </mesh>

      {/* Number value */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

export default VisualPage1;
