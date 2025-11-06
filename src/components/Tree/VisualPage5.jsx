import React, { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage5 = () => {
  const [traversalType, setTraversalType] = useState(null);
  const [highlightNode, setHighlightNode] = useState(null);

  // Simple binary tree nodes with positions
  const nodes = [
    { id: "A", pos: [0, 3, 0] },
    { id: "B", pos: [-2, 1.5, 0] },
    { id: "C", pos: [2, 1.5, 0] },
    { id: "D", pos: [-3, 0, 0] },
    { id: "E", pos: [-1, 0, 0] },
    { id: "F", pos: [1, 0, 0] },
    { id: "G", pos: [3, 0, 0] },
  ];

  const edges = [
    ["A", "B"],
    ["A", "C"],
    ["B", "D"],
    ["B", "E"],
    ["C", "F"],
    ["C", "G"],
  ];

  const handleTraversal = (type) => {
    setTraversalType(type);
    setHighlightNode(null);

    // Define traversal sequences
    const traversals = {
      Preorder: ["A", "B", "D", "E", "C", "F", "G"], // Root-Left-Right
      Inorder: ["D", "B", "E", "A", "F", "C", "G"], // Left-Root-Right
      Postorder: ["D", "E", "B", "F", "G", "C", "A"], // Left-Right-Root
      Breadth: ["A", "B", "C", "D", "E", "F", "G"], // Level order
    };

    const sequence = traversals[type];
    let i = 0;

    const interval = setInterval(() => {
      setHighlightNode(sequence[i]);
      i++;
      if (i >= sequence.length) clearInterval(interval);
    }, 800);
  };

  return (
    <div className="w-full h-[300px] relative">
      {/* Traversal Buttons */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => handleTraversal("Preorder")}
        >
          🔁 Preorder
        </button>
        <button
          className="btn btn-sm btn-outline-success"
          onClick={() => handleTraversal("Inorder")}
        >
          🔁 Inorder
        </button>
        <button
          className="btn btn-sm btn-outline-warning"
          onClick={() => handleTraversal("Postorder")}
        >
          🔁 Postorder
        </button>
        <button
          className="btn btn-sm btn-outline-info"
          onClick={() => handleTraversal("Breadth")}
        >
          🌐 Breadth-First
        </button>
      </div>

      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Title */}
        <FadeInText
          show={true}
          text={"Tree Traversals"}
          position={[0, 5, 0]}
          fontSize={0.7}
          color="white"
        />
        <FadeInText
          show={true}
          text={
            "Preorder (Root→Left→Right) • Inorder (Left→Root→Right) • Postorder (Left→Right→Root) • Breadth-First (Level Order)"
          }
          position={[0, 4.3, 0]}
          fontSize={0.33}
          color="#fde68a"
        />

        {/* Tree */}
        <TreeTraversal
          nodes={nodes}
          edges={edges}
          highlightNode={highlightNode}
        />

        {/* Info Panel */}
        {traversalType && (
          <TraversalInfo type={traversalType} position={[7, 2, 0]} />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Tree Visualization ===
const TreeTraversal = ({ nodes, edges, highlightNode }) => {
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
          isHighlighted={highlightNode === node.id}
        />
      ))}
    </group>
  );
};

// === Node ===
const TreeNode = ({ position, label, isHighlighted }) => {
  const color = isHighlighted ? "#f87171" : "#60a5fa";

  return (
    <group position={position}>
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

// === Connection Line ===
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

// === Info Panel (Right Side) ===
const TraversalInfo = ({ type, position }) => {
  let details = "";

  if (type === "Preorder") {
    details =
      "Preorder Traversal: Visit Root first, then Left subtree, then Right subtree.";
  } else if (type === "Inorder") {
    details =
      "Inorder Traversal: Visit Left subtree, then Root, then Right subtree.";
  } else if (type === "Postorder") {
    details =
      "Postorder Traversal: Visit Left subtree, then Right subtree, then Root.";
  } else if (type === "Breadth") {
    details =
      "Breadth-First Traversal (Level Order): Visit nodes level by level from top to bottom.";
  }

  const text = `🔹 ${type} Traversal\n${details}`;

  return (
    <FadeInText
      show={true}
      text={text}
      position={position}
      fontSize={0.33}
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
      maxWidth={9}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

export default VisualPage5;
