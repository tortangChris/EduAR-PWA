// TreeVisualization.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";

const VisualPage2 = () => {
  // Node positions
  const rootPos = [0, 4, 0];
  const childPos = [
    [-4, 1.5, 0],
    [4, 1.5, 0],
  ];
  const leafPos = [
    [-5.5, -1, 0],
    [-2.5, -1, 0],
    [2.5, -1, 0],
    [5.5, -1, 0],
  ];

  return (
    <div className="w-full h-[600px]">
      <Canvas camera={{ position: [0, 8, 14], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Root node */}
        <group position={rootPos}>
          <mesh>
            <sphereGeometry args={[0.6, 32, 32]} />
            <meshStandardMaterial color="#f87171" />
          </mesh>
          <Text
            position={[0, 1, 0]}
            fontSize={0.4}
            anchorX="center"
            anchorY="middle"
          >
            Root
          </Text>
        </group>

        {/* Children nodes */}
        {childPos.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshStandardMaterial color="#60a5fa" />
            </mesh>
            <Text
              position={[0, 1, 0]}
              fontSize={0.35}
              anchorX="center"
              anchorY="middle"
            >
              Child {i + 1}
            </Text>
          </group>
        ))}

        {/* Leaf nodes */}
        {leafPos.map((pos, i) => (
          <group key={i} position={pos}>
            <mesh>
              <sphereGeometry args={[0.4, 32, 32]} />
              <meshStandardMaterial color="#34d399" />
            </mesh>
            <Text
              position={[0, 1, 0]}
              fontSize={0.3}
              anchorX="center"
              anchorY="middle"
            >
              Leaf {i + 1}
            </Text>
          </group>
        ))}

        {/* Connections using drei <Line /> */}
        <Line points={[rootPos, childPos[0]]} color="white" lineWidth={2} />
        <Line points={[rootPos, childPos[1]]} color="white" lineWidth={2} />

        <Line points={[childPos[0], leafPos[0]]} color="white" lineWidth={2} />
        <Line points={[childPos[0], leafPos[1]]} color="white" lineWidth={2} />

        <Line points={[childPos[1], leafPos[2]]} color="white" lineWidth={2} />
        <Line points={[childPos[1], leafPos[3]]} color="white" lineWidth={2} />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

export default VisualPage2;
