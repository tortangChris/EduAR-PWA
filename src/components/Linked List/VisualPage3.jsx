import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage3 = ({ nodes = ["10", "20", "30", "40"] }) => {
  const spacing = 6;
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const positions = useMemo(() => {
    const mid = (nodes.length - 1) / 2;
    return nodes.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [nodes, spacing]);

  const handleNodeClick = (i) => {
    setSelectedNode(i);
    setHighlightedIndex(-1);

    // Animate traversal from head to clicked node
    let index = 0;
    const interval = setInterval(() => {
      setHighlightedIndex(index);
      index++;
      if (index > i) clearInterval(interval);
    }, 500);
  };

  const generateCode = (index, value) =>
    [
      "📘 Pseudo Code Example:",
      "",
      "Head <-> Node1 <-> Node2 <-> ... <-> Tail",
      `index = ${index}`,
      "",
      "currentNode = Head",
      `for i in range(0, index):`,
      "    currentNode = currentNode.next",
      "print('Accessed Node:', currentNode.value)",
      "",
      `// Result: ${value}`,
    ].join("\n");

  return (
    <div className="w-full h-[450px] flex items-center justify-center">
      <Canvas camera={{ position: [0, 5, 18], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <FadeText
          text="Doubly Linked List Overview"
          position={[0, 4, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        <FadeText
          text="Click a node to view its value and pseudo code"
          position={[0, 3.2, 0]}
          fontSize={0.35}
          color="white"
        />

        <Scene
          nodes={nodes}
          positions={positions}
          handleNodeClick={handleNodeClick}
          selectedNode={selectedNode}
          highlightedIndex={highlightedIndex}
        />

        {selectedNode !== null && (
          <group position={[positions[positions.length - 1][0] + 7.4, 0.5, 0]}>
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
  handleNodeClick,
  selectedNode,
  highlightedIndex,
}) => (
  <>
    {nodes.map((val, idx) => (
      <DNode
        key={idx}
        value={val}
        position={positions[idx]}
        isFirst={idx === 0}
        isLast={idx === nodes.length - 1}
        onClick={() => handleNodeClick(idx)}
        selected={selectedNode === idx}
        highlighted={idx <= highlightedIndex}
      />
    ))}
  </>
);

const DNode = ({
  value,
  position,
  isFirst,
  isLast,
  onClick,
  selected,
  highlighted,
}) => {
  const size = [4.5, 2, 1];
  const boxHalf = size[0] / 2;

  return (
    <group position={position}>
      {/* Main Box */}
      <mesh onClick={onClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={selected ? "#f87171" : highlighted ? "#fde68a" : "#60a5fa"}
        />
      </mesh>

      {/* Divider */}
      <mesh position={[0.5, 0, 0.51]}>
        <boxGeometry args={[0.05, size[1], 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Value */}
      <Text
        position={[-0.8, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {value}
      </Text>

      {/* Prev & Next Labels */}
      <Text
        position={[-1.8, 0, 0.55]}
        fontSize={0.3}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        Prev
      </Text>
      <Text
        position={[1.4, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        Next
      </Text>

      {/* Forward arrow (top) */}
      {!isLast ? (
        <Arrow3D
          start={[boxHalf, 0.4, 0]}
          end={[boxHalf + 1.8, 0.4, 0]}
          highlighted={highlighted}
        />
      ) : (
        <Arrow3D
          start={[boxHalf, 0.4, 0]}
          end={[boxHalf + 1.2, 0.4, 0]}
          highlighted={highlighted}
        />
      )}

      {/* Backward arrow (bottom) */}
      {!isFirst && (
        <Arrow3D
          start={[-boxHalf, -0.4, 0]}
          end={[-boxHalf - 1.8, -0.4, 0]}
          highlighted={highlighted}
        />
      )}

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

const Arrow3D = ({ start, end, highlighted }) => {
  const ref = useRef();
  const dir = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    0
  ).normalize();
  const length = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    0
  ).length();

  useFrame(() => {
    if (ref.current) {
      ref.current.setDirection(dir);
      ref.current.setLength(length, 0.4, 0.2);
    }
  });

  return (
    <primitive
      object={
        new THREE.ArrowHelper(
          dir,
          new THREE.Vector3(...start),
          length,
          highlighted ? "yellow" : "black"
        )
      }
      ref={ref}
    />
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
      maxWidth={10}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

export default VisualPage3;
