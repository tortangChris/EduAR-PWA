// VisualPage4.jsx
import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Line, Text } from "@react-three/drei";
import { a, useSpring } from "@react-spring/three";

// Animated Node Component
const AnimatedNode = ({ position, value, highlight }) => {
  const { scale } = useSpring({
    scale: highlight ? 1.3 : 1,
    config: { tension: 200, friction: 10 },
  });

  return (
    <a.group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color={highlight ? "gold" : "orange"} />
      </mesh>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>
    </a.group>
  );
};

// Tree Renderer
const BSTTree = ({ nodes, highlightValue }) => (
  <group>
    {nodes.map((node, i) => (
      <React.Fragment key={i}>
        <AnimatedNode
          position={node.position}
          value={node.value}
          highlight={node.value === highlightValue}
        />
        {node.parentPos && (
          <Line
            points={[node.parentPos, node.position]}
            color="white"
            lineWidth={2}
          />
        )}
      </React.Fragment>
    ))}
  </group>
);

const VisualPage4 = () => {
  const [nodes, setNodes] = useState([]);
  const [highlight, setHighlight] = useState(null);

  useEffect(() => {
    const values = [10, 5, 15, 7];
    let timeoutIds = [];

    const computePosition = (value, tree) => {
      if (tree.length === 0) {
        return { position: [0, 0, 0], parentPos: null }; // root
      }
      let current = tree[0]; // root
      let pos = [0, 0, 0];
      let parentPos = null;
      let depth = 0;

      while (true) {
        depth++;
        parentPos = current.position;
        if (value < current.value) {
          pos = [current.position[0] - 2 / depth, current.position[1] - 1.5, 0];
          const leftChild = tree.find(
            (n) =>
              n.parentPos &&
              n.parentPos[0] === current.position[0] &&
              n.position[0] < current.position[0]
          );
          if (!leftChild) break;
          current = leftChild;
        } else {
          pos = [current.position[0] + 2 / depth, current.position[1] - 1.5, 0];
          const rightChild = tree.find(
            (n) =>
              n.parentPos &&
              n.parentPos[0] === current.position[0] &&
              n.position[0] > current.position[0]
          );
          if (!rightChild) break;
          current = rightChild;
        }
      }
      return { position: pos, parentPos };
    };

    values.forEach((val, idx) => {
      // Step 1: Highlight comparison
      timeoutIds.push(
        setTimeout(() => {
          if (nodes.length > 0) {
            setHighlight(nodes[0].value); // highlight root first
          }
        }, idx * 4000)
      );

      // Step 2: Insert node
      timeoutIds.push(
        setTimeout(() => {
          setNodes((prev) => [
            ...prev,
            { value: val, ...computePosition(val, prev) },
          ]);
          setHighlight(val);
        }, idx * 4000 + 2000)
      );

      // Step 3: Reset highlight
      timeoutIds.push(
        setTimeout(() => {
          setHighlight(null);
        }, idx * 4000 + 3500)
      );
    });

    return () => timeoutIds.forEach((id) => clearTimeout(id));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 3, 10], fov: 55 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={1} />
        <OrbitControls enablePan enableZoom enableRotate />

        <BSTTree nodes={nodes} highlightValue={highlight} />

        <Text
          position={[0, 4, 0]}
          fontSize={0.6}
          color="yellow"
          anchorX="center"
        >
          BST Insertion: 10 → 5 → 15 → 7
        </Text>
      </Canvas>
    </div>
  );
};

export default VisualPage4;
