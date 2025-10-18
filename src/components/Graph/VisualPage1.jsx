import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage1 = ({ spacing = 4.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);

  const data = [
    { id: 0, label: "A", connections: [1, 2] },
    { id: 1, label: "B", connections: [0, 3] },
    { id: 2, label: "C", connections: [0, 3] },
    { id: 3, label: "D", connections: [1, 2] },
  ];

  const positions = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length;
    const radius = 4;
    return data.map((_, i) => [
      Math.cos(i * angleStep) * radius,
      Math.sin(i * angleStep) * radius,
      0,
    ]);
  }, [data.length]);

  const handleIndexClick = () => {
    setShowPanel((prev) => !prev);
    setPage(0);
  };

  const handleNextClick = () => {
    if (page < 2) setPage(page + 1);
    else setShowPanel(false);
  };

  const handleNodeClick = (i) => {
    setSelectedNode((prev) => (prev === i ? null : i));
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 6, 12], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Title */}
        <FadeInText
          show={true}
          text={"Introduction to Graphs"}
          position={[0, 4, 0]}
          fontSize={0.7}
          color="white"
        />

        {/* Edges */}
        {data.map((node, i) =>
          node.connections.map((conn) =>
            conn > i ? (
              <Edge
                key={`${i}-${conn}`}
                start={positions[i]}
                end={positions[conn]}
              />
            ) : null
          )
        )}

        {/* Nodes */}
        {data.map((node, i) => (
          <GraphNode
            key={i}
            node={node}
            position={positions[i]}
            selected={selectedNode === i}
            onClick={() => handleNodeClick(i)}
            onIndexClick={handleIndexClick}
          />
        ))}

        {/* Info Panel */}
        {showPanel && (
          <DefinitionPanel
            page={page}
            data={data}
            position={[8, 1, 0]}
            onNextClick={handleNextClick}
          />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Node ===
const GraphNode = ({ node, position, selected, onClick, onIndexClick }) => {
  const color = selected ? "#facc15" : "#60a5fa";
  const emissive = selected ? "#fbbf24" : "#000000";

  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>

      <FadeInText
        show={true}
        text={node.label}
        position={[0, 0.9, 0]}
        fontSize={0.4}
        color="white"
      />

      <Text
        position={[0, -0.8, 0]}
        fontSize={0.3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        onClick={onIndexClick}
      >
        [{node.id}]
      </Text>

      {selected && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Node {node.label} connected to {node.connections.join(", ")}
        </Text>
      )}
    </group>
  );
};

// === Edge ===
const Edge = ({ start, end }) => {
  const ref = useRef();
  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  );
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points]
  );

  return (
    <line ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#94a3b8" linewidth={2} />
    </line>
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
      "📘 Introduction to Graphs:",
      "",
      "A Graph is a non-linear data structure made of:",
      "• Vertices (nodes) → represent entities.",
      "• Edges → represent relationships between entities.",
    ].join("\n");
  } else if (page === 1) {
    content = [
      "📗 Types of Graphs:",
      "",
      "• Undirected graph: edges have no direction.",
      "• Directed graph (digraph): edges have direction.",
      "• Weighted graph: edges carry weights (e.g., distance, cost).",
    ].join("\n");
  } else if (page === 2) {
    content = [
      "📊 Real-life Examples:",
      "",
      "• Social networks (people = nodes, friendships = edges).",
      "• Maps (cities = nodes, roads = weighted edges).",
      "• Computer networks.",
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

export default VisualPage1;
