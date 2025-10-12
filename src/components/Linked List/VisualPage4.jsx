import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage4 = ({ nodes = ["A", "B", "C", "D"] }) => {
  const radius = 8;
  const [selectedNode, setSelectedNode] = useState(null);
  const [traversalProgress, setTraversalProgress] = useState(-1);

  // Compute circular positions
  const positions = useMemo(() => {
    const n = nodes.length;
    return nodes.map((_, i) => {
      const angle = (i / n) * Math.PI * 2;
      return [radius * Math.cos(angle), 0, radius * Math.sin(angle)];
    });
  }, [nodes, radius]);

  const handleNodeClick = (i) => {
    setSelectedNode(i);
    setTraversalProgress(-1);

    // Animate traversal along nodes in circular order
    let index = 0;
    const interval = setInterval(() => {
      setTraversalProgress(index);
      index++;
      if (index > i) clearInterval(interval);
    }, 800);
  };

  const generateCode = (index, value) =>
    [
      "📘 Pseudo Code Example (Circular Linked List):",
      "",
      "// Initialize circular linked list",
      "Head -> Node1 -> Node2 -> ... -> NodeN -> Head",
      "",
      `targetIndex = ${index}`,
      "currentNode = Head",
      "i = 0",
      "",
      "// Traverse until target node",
      "while i < targetIndex:",
      "    currentNode = currentNode.next",
      "    i += 1",
      "",
      "print('Accessed Node:', currentNode.value)",
      "",
      `// Result: ${value}`,
    ].join("\n");

  return (
    <div className="w-full h-[500px] flex items-center justify-center">
      <Canvas camera={{ position: [0, 12, 18], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <FadeText
          text="Circular Linked List (Circle Layout)"
          position={[0, 5, 0]}
          fontSize={0.6}
          color="#facc15"
        />
        <FadeText
          text="Click a node to start traversal"
          position={[0, 4.2, 0]}
          fontSize={0.35}
          color="white"
        />

        <Scene
          nodes={nodes}
          positions={positions}
          selectedNode={selectedNode}
          traversalProgress={traversalProgress}
          handleNodeClick={handleNodeClick}
        />

        {selectedNode !== null && (
          <group position={[radius + 5, 1, 0]}>
            <FadeText
              text={generateCode(selectedNode, nodes[selectedNode])}
              fontSize={0.3}
              color="#c7d2fe"
            />
          </group>
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

const Scene = ({
  nodes,
  positions,
  selectedNode,
  traversalProgress,
  handleNodeClick,
}) => (
  <>
    {nodes.map((val, idx) => (
      <CNode
        key={idx}
        value={val}
        position={positions[idx]}
        onClick={() => handleNodeClick(idx)}
        selected={selectedNode === idx}
      />
    ))}

    {/* Curved arrows and moving sphere for traversal */}
    {nodes.map((_, idx) => (
      <CurvedArrow
        key={idx}
        start={positions[idx]}
        end={positions[(idx + 1) % nodes.length]}
        highlight={traversalProgress >= idx}
        animate={traversalProgress >= idx}
      />
    ))}
  </>
);

const CNode = ({ value, position, selected, onClick }) => {
  const size = [2.5, 2, 1];
  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={selected ? "#f87171" : "#60a5fa"} />
      </mesh>
      <Text
        position={[0, size[1] / 2 + 0.2, 0]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {value}
      </Text>
    </group>
  );
};

const CurvedArrow = ({ start, end, highlight, animate }) => {
  const ref = useRef();
  const sphereRef = useRef();
  const [t, setT] = useState(0);

  // Compute control point for a curved arrow (Bezier)
  const mid = [(start[0] + end[0]) / 2, 0, (start[2] + end[2]) / 2];
  const control = [mid[0], 0, mid[2] + 2]; // lift in z to curve

  const curve = useMemo(() => {
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...start),
      new THREE.Vector3(...control),
      new THREE.Vector3(...end)
    );
  }, [start, control, end]);

  useFrame((state, delta) => {
    if (animate) {
      setT((prev) => Math.min(prev + delta * 0.5, 1));
      if (sphereRef.current) {
        const pos = curve.getPoint(t);
        sphereRef.current.position.set(pos.x, pos.y + 0.5, pos.z);
      }
    } else {
      setT(0);
      if (sphereRef.current) sphereRef.current.position.set(...start);
    }
  });

  // Line along curve
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <group>
      <line>
        <bufferGeometry attach="geometry" {...geometry} />
        <lineBasicMaterial
          attach="material"
          color={highlight ? "yellow" : "black"}
          linewidth={2}
        />
      </line>

      {/* Moving sphere for traversal */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    </group>
  );
};

const FadeText = ({
  text,
  fontSize = 0.5,
  color = "white",
  position = [0, 0, 0],
}) => {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    let frame;
    let start;
    const duration = 1000;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
      maxWidth={12}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

export default VisualPage4;
