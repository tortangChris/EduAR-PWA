import React, { useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage4 = () => {
  const [selectedOp, setSelectedOp] = useState(null);
  const [highlightNode, setHighlightNode] = useState(null);

  const nodes = [
    { id: 50, pos: [0, 3, 0] },
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

    let sequence = [];

    if (op === "Search") sequence = [50, 30, 40];
    else if (op === "Insert") sequence = [50, 70, 60, 65];
    else if (op === "Delete") sequence = [50, 30, 40];

    let i = 0;
    const interval = setInterval(() => {
      setHighlightNode(sequence[i]);
      i++;
      if (i >= sequence.length) clearInterval(interval);
    }, 1000);
  };

  return (
    <div className="w-full h-[300px] relative">
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
          position={[0, -1.5, 0]}
          fontSize={0.35}
          color="#fde68a"
        />

        {/* Tree Visualization */}
        <BSTVisualization
          nodes={nodes}
          edges={edges}
          highlightNode={highlightNode}
        />

        {/* Operations Panel (3D buttons) */}
        <OperationsPanel position={[-6, 1, 0]} onOperation={handleOperation} />

        {/* Info Panel */}
        {selectedOp && (
          <OperationInfo operation={selectedOp} position={[8, 2, 0]} />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Operations Panel (Reused 3D Button Logic) ===
const OperationsPanel = ({ position, onOperation }) => {
  const [activeButton, setActiveButton] = useState(null);

  const handleClick = (e, action) => {
    e.stopPropagation();
    setActiveButton(action);
    onOperation(action);
    setTimeout(() => setActiveButton(null), 250);
  };

  const renderButton = (label, action, y) => {
    const isActive = activeButton === action;
    const color = isActive ? "#22c55e" : "#38bdf8"; // green on click, blue default

    return (
      <group position={[0, y, 0]}>
        {/* Button Box */}
        <mesh onClick={(e) => handleClick(e, action)} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.6, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* Button Label */}
        <Text
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
          position={[0, 0, 0.06]}
          onClick={(e) => handleClick(e, action)}
        >
          {label}
        </Text>
      </group>
    );
  };

  return (
    <group position={position}>
      <FadeInText
        show={true}
        text={"BST Operations:"}
        position={[0, 2, 0]}
        fontSize={0.35}
        color="#fde68a"
      />

      {renderButton("🔍 Search", "Search", 1.2)}
      {renderButton("➕ Insert", "Insert", 0.4)}
      {renderButton("❌ Delete", "Delete", -0.4)}
    </group>
  );
};

// === BST Visualization ===
const BSTVisualization = ({ nodes, edges, highlightNode }) => (
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
