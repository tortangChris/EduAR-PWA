import React, { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage1 = ({ nodes = ["A", "B", "C"] }) => {
  const spacing = 6.3;
  const [selectedNode, setSelectedNode] = useState(null);

  const positions = useMemo(() => {
    const mid = (nodes.length - 1) / 2;
    return nodes.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [nodes, spacing]);

  const handleNodeClick = (i) =>
    setSelectedNode((prev) => (prev === i ? null : i));

  // Detailed but short pseudo code
  const generateCode = (index, value) => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "linkedList = Head -> Node1 -> Node2 -> ...",
      `index = ${index}`,
      "",
      "currentNode = Node at position index",
      "print('Accessed Node:', currentNode.value)",
      "",
      `// Result: ${value}`,
    ].join("\n");
  };

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <Canvas camera={{ position: [0, 4, 18], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Header */}
        <FadeText
          text="Linked List Introduction"
          position={[0, 4, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        {/* Instruction */}
        <FadeText
          text="Click a node to view its value and pseudo code"
          position={[0, 3.2, 0]}
          fontSize={0.35}
          color="white"
        />

        {/* Scene */}
        <Scene
          nodes={nodes}
          positions={positions}
          handleNodeClick={handleNodeClick}
          selectedNode={selectedNode}
        />

        {/* Pseudo code panel */}
        {selectedNode !== null && (
          <group position={[positions[positions.length - 1][0] + 8, 1, 0]}>
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

const Scene = ({ nodes, positions, handleNodeClick, selectedNode }) => {
  return (
    <>
      {nodes.map((val, idx) => (
        <Node
          key={idx}
          value={val}
          position={positions[idx]}
          isLast={idx === nodes.length - 1}
          onClick={() => handleNodeClick(idx)}
          selected={selectedNode === idx}
        />
      ))}
    </>
  );
};

const Node = ({ value, position, isLast, onClick, selected }) => {
  const size = [4.5, 2, 1];
  const boxHalf = size[0] / 2;

  return (
    <group position={position}>
      {/* Main Box */}
      <mesh onClick={onClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={selected ? "#f87171" : "#60a5fa"} />
      </mesh>

      {/* Divider */}
      <mesh position={[0.5, 0, 0.51]}>
        <boxGeometry args={[0.05, size[1], 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Data Label */}
      <Text
        position={[-0.8, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {value}
      </Text>

      {/* Next Label */}
      <Text
        position={[1.4, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        Next
      </Text>

      {/* Arrow or Null */}
      {!isLast ? (
        <Arrow3D start={[boxHalf, 0, 0]} end={[boxHalf + 1.8, 0, 0]} />
      ) : (
        <>
          <Arrow3D start={[boxHalf, 0, 0]} end={[boxHalf + 1.2, 0, 0]} />
          <NullCircle offset={boxHalf + 1.8} />
        </>
      )}

      {/* Floating label */}
      {selected && (
        <Text
          position={[0, size[1] + 0.2, 0]}
          fontSize={0.32}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Node "{value}"
        </Text>
      )}
    </group>
  );
};

const Arrow3D = ({ start, end }) => {
  const ref = useRef();
  const dir = new THREE.Vector3(end[0] - start[0], 0, 0).normalize();
  const length = new THREE.Vector3(end[0] - start[0], 0, 0).length();

  useFrame(() => {
    if (ref.current) {
      ref.current.setDirection(dir);
      ref.current.setLength(length, 0.4, 0.2);
    }
  });

  return (
    <primitive
      object={
        new THREE.ArrowHelper(dir, new THREE.Vector3(...start), length, "black")
      }
      ref={ref}
    />
  );
};

const NullCircle = ({ offset }) => (
  <group position={[offset, 0, 0]}>
    <mesh>
      <circleGeometry args={[0.6, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
    <Text
      position={[0, 0, 0.4]}
      fontSize={0.3}
      anchorX="center"
      anchorY="middle"
      color="white"
    >
      null
    </Text>
  </group>
);

const FadeText = ({
  text,
  fontSize = 0.5,
  color = "white",
  position = [0, 0, 0],
}) => {
  const [opacity, setOpacity] = useState(0);

  React.useEffect(() => {
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
      maxWidth={10}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

export default VisualPage1;
