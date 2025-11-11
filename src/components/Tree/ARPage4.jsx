import React, { useState, useRef, useEffect } from "react";
import { ARCanvas, Interactive, DefaultXRControllers } from "@react-three/xr";
import { Text, useFrame } from "@react-three/drei";
import * as THREE from "three";

const ARPage4 = () => {
  const [selectedOp, setSelectedOp] = useState(null);
  const [highlightNode, setHighlightNode] = useState(null);

  const nodes = [
    { id: 50, pos: [0, 1.5, -3] },
    { id: 30, pos: [-1.5, 1, -3] },
    { id: 70, pos: [1.5, 1, -3] },
    { id: 20, pos: [-2, 0.4, -3] },
    { id: 40, pos: [-1, 0.4, -3] },
    { id: 60, pos: [1, 0.4, -3] },
    { id: 80, pos: [2, 0.4, -3] },
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
      <ARCanvas camera={{ position: [0, 1.6, 0], fov: 60 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={0.8} />

        {/* Title */}
        <FadeInText
          show={true}
          text={"🌲 Binary Search Tree (BST)"}
          position={[0, 2.6, -3]}
          fontSize={0.25}
          color="white"
        />
        <FadeInText
          show={true}
          text={
            "Left subtree < Root < Right subtree — used for fast searching and sorting"
          }
          position={[0, 2.3, -3]}
          fontSize={0.18}
          color="#fde68a"
        />

        {/* Tree Visualization */}
        <BSTVisualizationAR
          nodes={nodes}
          edges={edges}
          highlightNode={highlightNode}
        />

        {/* Operations Panel */}
        <OperationsPanelAR
          position={[-1.8, 1.4, -2.5]}
          onOperation={handleOperation}
        />

        {/* Info Panel */}
        {selectedOp && (
          <OperationInfoAR operation={selectedOp} position={[1.8, 1.4, -2.5]} />
        )}

        <DefaultXRControllers />
      </ARCanvas>
    </div>
  );
};

// === Operations Panel (AR Interactive Buttons) ===
const OperationsPanelAR = ({ position, onOperation }) => {
  const [activeButton, setActiveButton] = useState(null);

  const handleClick = (action) => {
    setActiveButton(action);
    onOperation(action);
    setTimeout(() => setActiveButton(null), 300);
  };

  const renderButton = (label, action, y) => {
    const isActive = activeButton === action;
    const color = isActive ? "#22c55e" : "#38bdf8";

    return (
      <Interactive onSelect={() => handleClick(action)}>
        <group position={[0, y, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.25, 0.05]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <Text
            fontSize={0.13}
            color="white"
            anchorX="center"
            anchorY="middle"
            position={[0, 0, 0.06]}
          >
            {label}
          </Text>
        </group>
      </Interactive>
    );
  };

  return (
    <group position={position}>
      <FadeInText
        show={true}
        text={"BST Operations:"}
        position={[0, 0.6, 0]}
        fontSize={0.14}
        color="#fde68a"
      />
      {renderButton("🔍 Search", "Search", 0.3)}
      {renderButton("➕ Insert", "Insert", 0)}
      {renderButton("❌ Delete", "Delete", -0.3)}
    </group>
  );
};

// === BST Visualization ===
const BSTVisualizationAR = ({ nodes, edges, highlightNode }) => (
  <group>
    {edges.map(([a, b], i) => {
      const start = nodes.find((n) => n.id === a).pos;
      const end = nodes.find((n) => n.id === b).pos;
      return <Connection key={i} start={start} end={end} />;
    })}
    {nodes.map((node) => (
      <TreeNodeAR
        key={node.id}
        position={node.pos}
        label={node.id}
        isHighlighted={highlightNode === node.id}
      />
    ))}
  </group>
);

// === Tree Node (Sphere + Label) ===
const TreeNodeAR = ({ position, label, isHighlighted }) => {
  const color = isHighlighted ? "#f87171" : "#60a5fa";
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// === Edge Connection Line ===
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
const OperationInfoAR = ({ operation, position }) => {
  let details = "";
  if (operation === "Search") {
    details =
      "Search: Start from root. If value < root, go left; if > root, go right.";
  } else if (operation === "Insert") {
    details =
      "Insertion: Compare with root. Go left or right until empty spot found.";
  } else if (operation === "Delete") {
    details =
      "Deletion: If leaf — remove; one child — replace; two children — use inorder successor.";
  }

  const text = `🔹 Operation: ${operation}\n${details}`;

  return (
    <FadeInText
      show={true}
      text={text}
      position={position}
      fontSize={0.13}
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
      maxWidth={3.5}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default ARPage4;
