import React, { useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";

const VisualPage3 = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [highlighted, setHighlighted] = useState(null);
  const [mode, setMode] = useState(null); // "DFS" or "BFS"

  const handleIndexClick = () => {
    setShowPanel((prev) => !prev);
    setPage(0);
  };

  const handleNextClick = () => {
    if (page < 2) setPage(page + 1);
    else setShowPanel(false);
  };

  // Graph nodes (A, B, C, D)
  const nodes = useMemo(
    () => [
      { id: "A", position: [0, 3, 0] },
      { id: "B", position: [-2, 0, 0] },
      { id: "C", position: [2, 0, 0] },
      { id: "D", position: [0, -3, 0] },
    ],
    []
  );

  // Graph edges
  const edges = useMemo(
    () => [
      ["A", "B"],
      ["A", "C"],
      ["B", "C"],
      ["B", "D"],
      ["C", "D"],
    ],
    []
  );

  const getNodePosition = (id) => nodes.find((n) => n.id === id).position;

  const handleNodeClick = (id) => {
    setHighlighted((prev) => (prev === id ? null : id));
  };

  // === Traversal animation ===
  useEffect(() => {
    if (!mode) return;

    const dfsOrder = ["A", "B", "D", "C"];
    const bfsOrder = ["A", "B", "C", "D"];
    const order = mode === "DFS" ? dfsOrder : bfsOrder;

    let i = 0;
    const interval = setInterval(() => {
      setHighlighted(order[i]);
      i++;
      if (i >= order.length) {
        clearInterval(interval);
        setTimeout(() => setHighlighted(null), 1000);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="w-full h-[400px]">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        {/* Title */}
        <FadeInText
          show={true}
          text={"Graph Traversals"}
          position={[0, 5, 0]}
          fontSize={0.8}
          color="white"
        />

        {/* Subtitle */}
        <FadeInText
          show={true}
          text={"DFS and BFS Visualization"}
          position={[0, 4.3, 0]}
          fontSize={0.45}
          color="#93c5fd"
        />

        {/* Edges */}
        {edges.map(([a, b], i) => (
          <Line
            key={i}
            points={[getNodePosition(a), getNodePosition(b)]}
            color="#94a3b8"
            lineWidth={1.5}
            dashed={false}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <NodeSphere
            key={i}
            id={node.id}
            position={node.position}
            highlighted={highlighted === node.id}
            onClick={() => handleNodeClick(node.id)}
          />
        ))}

        {/* Definition Panel */}
        {showPanel && (
          <DefinitionPanel
            page={page}
            position={[8, 1, 0]}
            onNextClick={handleNextClick}
          />
        )}

        {/* 3D Buttons for DFS/BFS */}
        <Button3D
          label="Run DFS"
          position={[-2.5, -5, 0]}
          color={mode === "DFS" ? "#facc15" : "#60a5fa"}
          onClick={() => setMode("DFS")}
        />
        <Button3D
          label="Run BFS"
          position={[2.5, -5, 0]}
          color={mode === "BFS" ? "#facc15" : "#60a5fa"}
          onClick={() => setMode("BFS")}
        />

        {/* Info Toggle */}
        <Text
          position={[0, -6, 0]}
          fontSize={0.4}
          color="#38bdf8"
          anchorX="center"
          anchorY="middle"
          onClick={handleIndexClick}
        >
          📘 Learn DFS/BFS ▶
        </Text>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === NodeSphere ===
const NodeSphere = ({ id, position, highlighted, onClick }) => {
  const color = highlighted ? "#facc15" : "#60a5fa";
  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={highlighted ? "#fbbf24" : "#000000"}
          emissiveIntensity={highlighted ? 0.5 : 0}
        />
      </mesh>
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {id}
      </Text>
    </group>
  );
};

// === Button3D ===
const Button3D = ({ label, position, color, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position}>
      <mesh
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.4, 0.8, 0.2]} />
        <meshStandardMaterial
          color={hovered ? "#38bdf8" : color}
          emissive={hovered ? "#0284c7" : "#000000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <Text
        position={[0, 0, 0.15]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

// === Fade-in Text ===
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.06, 1);
      scale.current = Math.min(scale.current + 0.06, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.06, 0);
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
      maxWidth={8}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// === Definition Panel ===
const DefinitionPanel = ({ page, position, onNextClick }) => {
  let content = "";

  if (page === 0) {
    content = [
      "🔍 Graph Traversal:",
      "",
      "Process of visiting all nodes in a graph.",
      "Two major methods:",
      "1️⃣ Depth-First Search (DFS)",
      "2️⃣ Breadth-First Search (BFS)",
    ].join("\n");
  } else if (page === 1) {
    content = [
      "📘 DFS (Depth-First Search):",
      "",
      "• Explore deep before backtracking.",
      "• Implemented via recursion or stack.",
      "• Example: solving puzzles, topological sort.",
    ].join("\n");
  } else if (page === 2) {
    content = [
      "📗 BFS (Breadth-First Search):",
      "",
      "• Explore level by level.",
      "• Implemented via queue.",
      "• Example: shortest path in unweighted graphs.",
      "",
      "Complexity: O(V + E)",
    ].join("\n");
  }

  const nextLabel = page < 2 ? "Next ▶" : "Close ✖";

  return (
    <group>
      <FadeInText
        show={true}
        text={content}
        position={position}
        fontSize={0.32}
        color="#fde68a"
      />
      <Text
        position={[position[0], position[1] - 2.8, position[2]]}
        fontSize={0.45}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        onClick={onNextClick}
      >
        {nextLabel}
      </Text>
    </group>
  );
};

export default VisualPage3;
