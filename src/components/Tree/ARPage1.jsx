import React, { useRef, useState } from "react";
import { ARCanvas, Interactive, DefaultXRControllers } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const ARPage1 = () => {
  const [selectedNode, setSelectedNode] = useState(null);

  // Tree structure
  const nodes = [
    { id: "A", pos: [0, 1.8, -3], type: "Root" },
    { id: "B", pos: [-1.2, 1.2, -3], type: "Child" },
    { id: "C", pos: [1.2, 1.2, -3], type: "Child" },
    { id: "D", pos: [-1.8, 0.6, -3], type: "Leaf" },
    { id: "E", pos: [-0.6, 0.6, -3], type: "Leaf" },
    { id: "F", pos: [0.6, 0.6, -3], type: "Leaf" },
    { id: "G", pos: [1.8, 0.6, -3], type: "Leaf" },
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
      <ARCanvas camera={{ position: [0, 1.6, 0], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={0.8} />

        {/* Header */}
        <FadeInText
          show={true}
          text={"🌳 Introduction to Trees"}
          position={[0, 2.6, -3]}
          fontSize={0.25}
          color="white"
        />

        <FadeInText
          show={true}
          text={"A hierarchical, non-linear data structure of connected nodes"}
          position={[0, 2.3, -3]}
          fontSize={0.18}
          color="#fde68a"
        />

        {/* Tree Visualization */}
        <TreeVisualizationAR
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          selectedNode={selectedNode}
        />

        {/* Info Panel */}
        {selectedNode && (
          <NodeInfoPanel node={selectedNode} position={[0, 0.2, -2]} />
        )}

        <DefaultXRControllers />
      </ARCanvas>
    </div>
  );
};

// === Tree Visualization (AR Interactive Nodes) ===
const TreeVisualizationAR = ({ nodes, edges, onNodeClick, selectedNode }) => {
  return (
    <group>
      {edges.map(([a, b], i) => {
        const start = nodes.find((n) => n.id === a).pos;
        const end = nodes.find((n) => n.id === b).pos;
        return <Connection key={i} start={start} end={end} />;
      })}

      {nodes.map((node) => (
        <Interactive key={node.id} onSelect={() => onNodeClick(node)}>
          <TreeNode
            position={node.pos}
            label={node.id}
            type={node.type}
            isSelected={selectedNode?.id === node.id}
          />
        </Interactive>
      ))}
    </group>
  );
};

// === Node (Sphere + Label) ===
const TreeNode = ({ position, label, type, isSelected }) => {
  const baseColor =
    type === "Root" ? "#60a5fa" : type === "Child" ? "#34d399" : "#fbbf24";
  const color = isSelected ? "#f87171" : baseColor;

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.15}
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

// === Node Info Panel ===
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
      fontSize={0.18}
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
      maxWidth={4}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default ARPage1;
