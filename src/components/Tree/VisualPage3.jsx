// VisualPage3.jsx
import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";

// --- Helper Component for Node (Sphere + Label) ---
const Node = ({ position, label, color = "orange" }) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[0.2, 32, 32]} />
      <meshStandardMaterial color={color} />
    </mesh>
    {label && (
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    )}
  </group>
);

// --- Example Trees ---
const GeneralTree = ({ position }) => (
  <group position={position}>
    <Node position={[0, 0, 0]} label="Root" color="blue" />
    <Node position={[-1, -1, 0]} label="A" />
    <Node position={[0, -1, 0]} label="B" />
    <Node position={[1, -1, 0]} label="C" />
    <Line
      points={[
        [0, 0, 0],
        [-1, -1, 0],
      ]}
      color="white"
      lineWidth={2}
    />
    <Line
      points={[
        [0, 0, 0],
        [0, -1, 0],
      ]}
      color="white"
      lineWidth={2}
    />
    <Line
      points={[
        [0, 0, 0],
        [1, -1, 0],
      ]}
      color="white"
      lineWidth={2}
    />
    <Text position={[0, 2, 0]} fontSize={0.4} color="yellow" anchorX="center">
      General Tree
    </Text>
  </group>
);

const BinaryTree = ({ position }) => (
  <group position={position}>
    <Node position={[0, 0, 0]} label="Root" color="green" />
    <Node position={[-1, -1, 0]} label="L" />
    <Node position={[1, -1, 0]} label="R" />
    <Line
      points={[
        [0, 0, 0],
        [-1, -1, 0],
      ]}
      color="white"
      lineWidth={2}
    />
    <Line
      points={[
        [0, 0, 0],
        [1, -1, 0],
      ]}
      color="white"
      lineWidth={2}
    />
    <Text position={[0, 2, 0]} fontSize={0.4} color="yellow" anchorX="center">
      Binary Tree
    </Text>
  </group>
);

const FullBinaryTree = ({ position }) => (
  <group position={position}>
    <Node position={[0, 0, 0]} label="Root" color="red" />
    <Node position={[-1, -1, 0]} label="L" />
    <Node position={[1, -1, 0]} label="R" />
    <Node position={[-1.5, -2, 0]} label="LL" />
    <Node position={[-0.5, -2, 0]} label="LR" />
    <Node position={[0.5, -2, 0]} label="RL" />
    <Node position={[1.5, -2, 0]} label="RR" />
    <Line
      points={[
        [0, 0, 0],
        [-1, -1, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [0, 0, 0],
        [1, -1, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [-1, -1, 0],
        [-1.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [-1, -1, 0],
        [-0.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [1, -1, 0],
        [0.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [1, -1, 0],
        [1.5, -2, 0],
      ]}
      color="white"
    />
    <Text position={[0, 2, 0]} fontSize={0.4} color="yellow" anchorX="center">
      Full Binary Tree
    </Text>
  </group>
);

const CompleteBinaryTree = ({ position }) => (
  <group position={position}>
    <Node position={[0, 0, 0]} label="Root" color="purple" />
    <Node position={[-1, -1, 0]} label="L" />
    <Node position={[1, -1, 0]} label="R" />
    <Node position={[-1.5, -2, 0]} label="LL" />
    <Node position={[-0.5, -2, 0]} label="LR" />
    <Node position={[0.5, -2, 0]} label="RL" />
    {/* RR missing to show "complete" */}
    <Line
      points={[
        [0, 0, 0],
        [-1, -1, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [0, 0, 0],
        [1, -1, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [-1, -1, 0],
        [-1.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [-1, -1, 0],
        [-0.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [1, -1, 0],
        [0.5, -2, 0],
      ]}
      color="white"
    />
    <Text position={[0, 2, 0]} fontSize={0.4} color="yellow" anchorX="center">
      Complete Binary Tree
    </Text>
  </group>
);

const BST = ({ position }) => (
  <group position={position}>
    <Node position={[0, 0, 0]} label="8" color="orange" />
    <Node position={[-1, -1, 0]} label="3" />
    <Node position={[1, -1, 0]} label="10" />
    <Node position={[-1.5, -2, 0]} label="1" />
    <Node position={[-0.5, -2, 0]} label="6" />
    <Node position={[1.5, -2, 0]} label="14" />
    <Line
      points={[
        [0, 0, 0],
        [-1, -1, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [0, 0, 0],
        [1, -1, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [-1, -1, 0],
        [-1.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [-1, -1, 0],
        [-0.5, -2, 0],
      ]}
      color="white"
    />
    <Line
      points={[
        [1, -1, 0],
        [1.5, -2, 0],
      ]}
      color="white"
    />
    <Text position={[0, 2, 0]} fontSize={0.4} color="yellow" anchorX="center">
      Binary Search Tree
    </Text>
  </group>
);

// --- Main Page ---
export default function VisualPage3() {
  const radius = 10; // layo ng trees sa gitna
  const trees = [
    { comp: GeneralTree, angle: 0 },
    { comp: BinaryTree, angle: (2 * Math.PI) / 5 },
    { comp: FullBinaryTree, angle: (4 * Math.PI) / 5 },
    { comp: CompleteBinaryTree, angle: (6 * Math.PI) / 5 },
    { comp: BST, angle: (8 * Math.PI) / 5 },
  ];

  return (
    <div className="w-screen h-screen">
      <Canvas camera={{ position: [0, 2, 15], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />

        {trees.map(({ comp: Tree, angle }, idx) => {
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          return <Tree key={idx} position={[x, 0, z]} />;
        })}
      </Canvas>
    </div>
  );
}
