import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

// Graph data
const nodes = [
  { id: 0, label: "A" },
  { id: 1, label: "B" },
  { id: 2, label: "C" },
  { id: 3, label: "D" },
];

const edges = [
  { from: 0, to: 1, weight: 2 },
  { from: 0, to: 2, weight: 5 },
  { from: 1, to: 3, weight: 3 },
  { from: 2, to: 3, weight: 1 },
];

// === Dijkstra Algorithm ===
const dijkstra = (edges, start) => {
  const dist = {};
  const prev = {};
  const visited = new Set();
  const q = nodes.map((n) => n.id);

  nodes.forEach((n) => (dist[n.id] = Infinity));
  dist[start] = 0;

  while (q.length) {
    q.sort((a, b) => dist[a] - dist[b]);
    const u = q.shift();
    visited.add(u);

    edges
      .filter((e) => e.from === u || e.to === u)
      .forEach((e) => {
        const v = e.from === u ? e.to : e.from;
        if (!visited.has(v)) {
          const alt = dist[u] + e.weight;
          if (alt < dist[v]) {
            dist[v] = alt;
            prev[v] = u;
          }
        }
      });
  }
  return { dist, prev };
};

const getPath = (prev, start, end) => {
  const path = [];
  let u = end;
  while (u !== start && u !== undefined) {
    path.unshift(u);
    u = prev[u];
  }
  if (u === start) path.unshift(start);
  return path;
};

const VisualPage4 = () => {
  const [algorithm, setAlgorithm] = useState(null);
  const [highlightedEdges, setHighlightedEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const positions = useMemo(() => {
    const angleStep = (2 * Math.PI) / nodes.length;
    const radius = 4;
    return nodes.map((_, i) => [
      Math.cos(i * angleStep) * radius,
      Math.sin(i * angleStep) * radius,
      0,
    ]);
  }, []);

  const handleAlgorithmClick = (algo) => {
    setAlgorithm(algo);

    if (algo === "Dijkstra") {
      const { prev } = dijkstra(edges, 0);
      const path = getPath(prev, 0, 3);
      const pathEdges = [];
      for (let i = 0; i < path.length - 1; i++) {
        pathEdges.push({ from: path[i], to: path[i + 1] });
      }
      setHighlightedEdges(pathEdges);
    } else if (algo === "Bellman-Ford") {
      setHighlightedEdges([
        { from: 0, to: 1 },
        { from: 1, to: 3 },
      ]);
    } else if (algo === "Floyd-Warshall") {
      setHighlightedEdges([
        { from: 0, to: 2 },
        { from: 2, to: 3 },
      ]);
    }
  };

  return (
    <div className="w-full h-[500px]">
      <Canvas camera={{ position: [0, 8, 14], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight
          position={[10, 15, 10]}
          angle={0.3}
          penumbra={0.5}
          intensity={1.2}
          castShadow
        />
        <color attach="background" args={["#0f172a"]} />

        <FadeInText
          show={true}
          text="Shortest Path Algorithms"
          position={[0, 5, 0]}
          fontSize={0.7}
          color="white"
        />

        {/* Edges */}
        {edges.map((edge, i) => (
          <EnhancedEdge
            key={i}
            start={positions[edge.from]}
            end={positions[edge.to]}
            weight={edge.weight}
            highlight={highlightedEdges.some(
              (e) =>
                (e.from === edge.from && e.to === edge.to) ||
                (e.from === edge.to && e.to === edge.from)
            )}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <EnhancedNode
            key={i}
            node={node}
            position={positions[i]}
            selected={selectedNode === i}
            onClick={() => setSelectedNode((prev) => (prev === i ? null : i))}
          />
        ))}

        {/* Algorithm Buttons */}
        <EnhancedButton
          label="Dijkstra"
          position={[-5, -4, 0]}
          onClick={() => handleAlgorithmClick("Dijkstra")}
        />
        <EnhancedButton
          label="Bellman-Ford"
          position={[0, -4, 0]}
          onClick={() => handleAlgorithmClick("Bellman-Ford")}
        />
        <EnhancedButton
          label="Floyd-Warshall"
          position={[5, -4, 0]}
          onClick={() => handleAlgorithmClick("Floyd-Warshall")}
        />

        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  );
};

// === Enhanced Node ===
const EnhancedNode = ({ node, position, selected, onClick }) => {
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (selected) {
      const scale = 1 + 0.1 * Math.sin(clock.elapsedTime * 5);
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onClick} castShadow>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={selected ? "#facc15" : "#60a5fa"}
          emissive={selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={selected ? 0.6 : 0}
        />
      </mesh>
      <Text
        position={[0, 0.9, 0]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {node.label}
      </Text>
    </group>
  );
};

// === Enhanced Edge (Tube) ===
const EnhancedEdge = ({ start, end, weight, highlight }) => {
  const curve = useMemo(
    () =>
      new THREE.LineCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...end)
      ),
    [start, end]
  );
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 20, highlight ? 0.12 : 0.08, 8, false),
    [curve, highlight]
  );
  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial color={highlight ? "#facc15" : "#94a3b8"} />
      </mesh>
      <Text
        position={[(start[0] + end[0]) / 2, (start[1] + end[1]) / 2 + 0.25, 0]}
        fontSize={0.25}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        {weight}
      </Text>
    </group>
  );
};

// === Enhanced Button ===
const EnhancedButton = ({ label, position, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();
  useFrame(() => {
    meshRef.current.rotation.y += 0.005;
    meshRef.current.position.y += hovered
      ? 0.02 * Math.sin(Date.now() * 0.01)
      : 0;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[2.5, 1, 0.6]} />
        <meshStandardMaterial
          color={hovered ? "#facc15" : "#38bdf8"}
          emissive={hovered ? "#fde68a" : "#000000"}
        />
      </mesh>
      <Text
        position={[0, 0, 0.35]}
        fontSize={0.3}
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
    >
      {text}
    </Text>
  );
};

export default VisualPage4;
