import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage4 = () => {
  const [selectedOp, setSelectedOp] = useState(null);
  const [highlightNode, setHighlightNode] = useState(null);

  // BST Node Positions (for visual clarity)
  const nodes = [
    { id: 50, pos: [0, 3, 0] }, // root
    { id: 30, pos: [-2, 1.5, 0] },
    { id: 70, pos: [2, 1.5, 0] },
    { id: 20, pos: [-3, 0, 0] },
    { id: 40, pos: [-1, 0, 0] },
    { id: 60, pos: [1, 0, 0] },
    { id: 80, pos: [3, 0, 0] },
  ];

  const edges = [
    [50, 30],
    [50, 70],
    [30, 20],
    [30, 40],
    [70, 60],
    [70, 80],
  ];

  const handleOperation = (op) => {
    setSelectedOp(op);
    setHighlightNode(null);

    // Simulate operation logic animation
    if (op === "Search") {
      const sequence = [50, 30, 40];
      let i = 0;
      const interval = setInterval(() => {
        setHighlightNode(sequence[i]);
        i++;
        if (i >= sequence.length) clearInterval(interval);
      }, 1000);
    } else if (op === "Insert") {
      const sequence = [50, 70, 60, 65];
      let i = 0;
      const interval = setInterval(() => {
        setHighlightNode(sequence[i]);
        i++;
        if (i >= sequence.length) clearInterval(interval);
      }, 1000);
    } else if (op === "Delete") {
      const sequence = [50, 30, 40];
      let i = 0;
      const interval = setInterval(() => {
        setHighlightNode(sequence[i]);
        i++;
        if (i >= sequence.length) clearInterval(interval);
      }, 1000);
    }
  };

  return (
    <div className="w-full h-[300px] relative">
      {/* Operation Buttons */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() => handleOperation("Search")}
        >
          🔍 Search
        </button>
        <button
          className="btn btn-sm btn-outline-success"
          onClick={() => handleOperation("Insert")}
        >
          ➕ Insert
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => handleOperation("Delete")}
        >
          ❌ Delete
        </button>
      </div>

      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Title */}
        <FadeInText
          show={true}
          text={"Binary Search Tree (BST)"}
          position={[0, 5, 0]}
          fontSize={0.7}
          color="white"
        />
        <FadeInText
          show={true}
          text={
            "Left subtree < Root < Right subtree — used for fast searching and sorting"
          }
          position={[0, 4.3, 0]}
          fontSize={0.35}
          color="#fde68a"
        />

        {/* Tree Visualization */}
        <BSTVisualization
          nodes={nodes}
          edges={edges}
          highlightNode={highlightNode}
        />

        {/* Info Panel (Right side) */}
        {selectedOp && (
          <OperationInfo operation={selectedOp} position={[7, 2, 0]} />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === BST Visualization ===
const BSTVisualization = ({ nodes, edges, highlightNode }) => {
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

// === Node Component ===
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

// === Info Panel ===
const OperationInfo = ({ operation, position }) => {
  let details = "";

  if (operation === "Search") {
    details =
      "Search: Start from root. If value < root, go left; if > root, go right. Repeat until found or null.";
  } else if (operation === "Insert") {
    details =
      "Insertion: Compare with root. Go left or right until correct empty spot is found, then insert new node.";
  } else if (operation === "Delete") {
    details =
      "Deletion: If node is a leaf — remove it. If it has one child — replace it. If two children — replace with inorder successor.";
  }

  const text = `🔹 Operation: ${operation}\n${details}`;

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

export default VisualPage4;
