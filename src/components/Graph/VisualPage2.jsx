import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage2 = () => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const handleIndexClick = () => {
    setShowPanel((prev) => !prev);
    setPage(0);
  };

  const handleNextClick = () => {
    if (page < 2) setPage(page + 1);
    else setShowPanel(false);
  };

  const handleSelect = (type) => {
    setSelected((prev) => (prev === type ? null : type));
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 5, 12], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Header */}
        <FadeInText
          show={true}
          text={"Graph Representation"}
          position={[0, 4, 0]}
          fontSize={0.7}
          color="white"
        />

        {/* Left: Adjacency Matrix */}
        <AdjacencyMatrix
          position={[-5, 0, 0]}
          selected={selected === "matrix"}
          onClick={() => handleSelect("matrix")}
          onIndexClick={handleIndexClick}
        />

        {/* Right: Adjacency List */}
        <AdjacencyList
          position={[5, 0, 0]}
          selected={selected === "list"}
          onClick={() => handleSelect("list")}
          onIndexClick={handleIndexClick}
        />

        {/* Info Panel */}
        {showPanel && (
          <DefinitionPanel
            page={page}
            position={[0, -1, 0]}
            onNextClick={handleNextClick}
          />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Adjacency Matrix Visualization ===
const AdjacencyMatrix = ({ position, selected, onClick, onIndexClick }) => {
  const size = 4;
  const boxes = useMemo(() => {
    const items = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const hasEdge = Math.random() > 0.5; // random edges
        items.push({
          key: `${i}-${j}`,
          pos: [j - 1.5, 1.5 - i, 0],
          active: hasEdge,
        });
      }
    }
    return items;
  }, []);

  return (
    <group position={position}>
      <FadeInText
        show={true}
        text={"Adjacency Matrix"}
        position={[0, 3, 0]}
        fontSize={0.4}
        color="#93c5fd"
      />
      {boxes.map((b) => (
        <mesh
          key={b.key}
          position={[b.pos[0], b.pos[1], b.pos[2]]}
          onClick={onClick}
        >
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial
            color={b.active ? "#60a5fa" : "#1e3a8a"}
            emissive={selected && b.active ? "#facc15" : "#000"}
            emissiveIntensity={selected && b.active ? 0.5 : 0}
          />
        </mesh>
      ))}

      <Text
        position={[0, -2.8, 0]}
        fontSize={0.3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        onClick={onIndexClick}
      >
        [Matrix]
      </Text>
    </group>
  );
};

// === Adjacency List Visualization ===
const AdjacencyList = ({ position, selected, onClick, onIndexClick }) => {
  const nodes = useMemo(
    () => [
      { id: 0, connections: [1, 2] },
      { id: 1, connections: [3] },
      { id: 2, connections: [3] },
      { id: 3, connections: [] },
    ],
    []
  );

  return (
    <group position={position}>
      <FadeInText
        show={true}
        text={"Adjacency List"}
        position={[0, 3, 0]}
        fontSize={0.4}
        color="#93c5fd"
      />

      {nodes.map((node, i) => (
        <group key={i} position={[0, 2 - i * 1.2, 0]}>
          <mesh onClick={onClick}>
            <sphereGeometry args={[0.35, 32, 32]} />
            <meshStandardMaterial
              color={selected ? "#34d399" : "#4ade80"}
              emissive={selected ? "#facc15" : "#000"}
              emissiveIntensity={selected ? 0.4 : 0}
            />
          </mesh>

          {node.connections.map((c, j) => (
            <mesh key={j} position={[1.2 + j * 0.8, 0, 0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#a5f3fc" />
            </mesh>
          ))}

          <Text
            position={[-0.9, 0, 0]}
            fontSize={0.3}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {`V${node.id}`}
          </Text>
        </group>
      ))}

      <Text
        position={[0, -2.8, 0]}
        fontSize={0.3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        onClick={onIndexClick}
      >
        [List]
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
      "📘 Adjacency Matrix:",
      "",
      "• 2D array, matrix[i][j] = 1 if edge exists, else 0.",
      "• Pros: simple, fast edge lookup.",
      "• Cons: uses O(V²) space.",
    ].join("\n");
  } else if (page === 1) {
    content = [
      "📗 Adjacency List:",
      "",
      "• Each vertex stores list of connected vertices.",
      "• Pros: efficient for sparse graphs.",
      "• Cons: slower for direct edge lookup.",
    ].join("\n");
  } else if (page === 2) {
    content = [
      "🎨 3D Visual Summary:",
      "",
      "• Left → Matrix grid representation.",
      "• Right → Linked list style representation.",
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

export default VisualPage2;
