import React, { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage4 = ({ rows = 3, cols = 3, depth = 3, spacing = 2.0 }) => {
  const initialCube = useRef(
    Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) =>
        Array.from(
          { length: depth },
          (_, d) => r * cols * depth + c * depth + d + 1
        )
      )
    )
  );

  const [cubes, setCubes] = useState(
    create3DCubes(initialCube.current, spacing)
  );

  function create3DCubes(cubeArray, spacingVal) {
    const midX = (cols - 1) / 2;
    const midY = (rows - 1) / 2;
    const midZ = (depth - 1) / 2;

    return cubeArray.flatMap((row, r) =>
      row.flatMap((col, c) =>
        col.map((value, z) => ({
          id: `cube-${r}-${c}-${z}`,
          value,
          position: [
            (c - midX) * spacingVal,
            (midY - r) * spacingVal,
            (z - midZ) * spacingVal,
          ],
        }))
      )
    );
  }

  return (
    <div className="w-full h-[300px] bg-gray-50 flex flex-col items-center justify-center">
      <div className="w-full h-full">
        <Canvas camera={{ position: [8, 8, 8], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {cubes.map((b) => (
            <Box key={b.id} value={b.value} position={b.position} />
          ))}

          {/* 1st Dimensional */}
          <Text
            position={[0, (rows / 2) * spacing + 2, 0]}
            fontSize={0.7}
            color="black"
            anchorX="center"
            anchorY="middle"
          >
            1st Dimensional
          </Text>

          {/* 2nd Dimensional */}
          <Text
            position={[-(cols / 2) * spacing - 2, 0, 0]}
            fontSize={0.7}
            color="black"
            anchorX="center"
            anchorY="middle"
            rotation={[0, 0, Math.PI / 2]}
          >
            2nd Dimensional
          </Text>

          {/* 3rd Dimensional */}
          <Text
            position={[(cols / 2) * spacing + 2, 0, 0]}
            fontSize={0.7}
            color="black"
            anchorX="center"
            anchorY="middle"
            rotation={[0, -Math.PI / 2, 0]}
            scale={[-1, 1, 1]}
          >
            3rd Dimensional
          </Text>

          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
};

const Box = ({ value, position }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.25}
        anchorX="center"
        anchorY="middle"
        color="#ffffff"
      >
        {value}
      </Text>
    </group>
  );
};

export default VisualPage4;
