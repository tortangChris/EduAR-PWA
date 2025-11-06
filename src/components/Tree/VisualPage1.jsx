import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage1 = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  // Node structure
  const nodes = [
    { id: "A", pos: [0, 3, 0], type: "Root" },
    { id: "B", pos: [-2, 1.5, 0], type: "Child" },
    { id: "C", pos: [2, 1.5, 0], type: "Child" },
    { id: "D", pos: [-3, 0, 0], type: "Leaf" },
    { id: "E", pos: [-1, 0, 0], type: "Leaf" },
    { id: "F", pos: [1, 0, 0], type: "Leaf" },
    { id: "G", pos: [3, 0, 0], type: "Leaf" },
  ];

  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "F"],
    ["C", "G"],
  ];

  const handleNodeClick = (node) => {
    setSelectedNode(node);
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Header */}
        <FadeInText
          show={true}
          text={"Introduction to Trees"}
          position={[0, 5, 0]}
          fontSize={0.7}
          color="white"
        />

        <FadeInText
          show={true}
          text={"A hierarchical, non-linear data structure of connected nodes"}
          position={[0, 4.3, 0]}
          fontSize={0.35}
          color="#fde68a"
        />

        {/* Tree Visualization */}
        <TreeVisualization
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
        />

        {/* Info Panel (Right Side - when clicked) */}
        {selectedNode && (
          <NodeInfoPanel node={selectedNode} position={[7, 2, 0]} />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Tree Visualization ===
const TreeVisualization = ({ nodes, edges, onNodeClick, selectedNode }) => {
  return (
    <group>
      {edges.map(([a, b], i) => {
        const start = nodes.find((n) => n.id === a).pos;
        const end = nodes.find((n) => n.id === b).pos;
        return <Connection key={i} start={start} end={end} />;
      })}

      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          position={node.pos}
          label={node.id}
          type={node.type}
          onClick={() => onNodeClick(node)}
          isSelected={selectedNode?.id === node.id}
        />
      ))}
    </group>
  );
};

// === Node (Sphere + Label) ===
const TreeNode = ({ position, label, type, onClick, isSelected }) => {
  const baseColor =
    type === "Root" ? "#60a5fa" : type === "Child" ? "#34d399" : "#fbbf24";

  const color = isSelected ? "#f87171" : baseColor;

  return (
    <group position={position} onClick={onClick}>
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.8, 0]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// === Edge (Line between nodes) ===
const Connection = ({ start, end }) => {
  const points = [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line>
      <primitive object={geometry} />
      <lineBasicMaterial color="#94a3b8" linewidth={2} />
    </line>
  );
};

// === Node Info Panel (Right Side) ===
const NodeInfoPanel = ({ node, position }) => {
  let description = "";
  if (node.type === "Root") {
    description = "Topmost node in the tree. Has no parent.";
  } else if (node.type === "Child") {
    description = "A node that has a parent and may have children.";
  } else {
    description = "A leaf node — has no children.";
  }

  const content = [
    `🔹 Node: ${node.id}`,
    `Type: ${node.type}`,
    "",
    description,
  ].join("\n");

  return (
    <FadeInText
      show={true}
      text={content}
      position={position}
      fontSize={0.35}
      color="#a5f3fc"
    />
  );
};

// === Fade-in Text ===
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.05, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.05, 0);
      scale.current = 0.6;
    }
    if (ref.current && ref.current.material) {
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      material-transparent
      maxWidth={10}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default VisualPage1;
