// LinkedListAssessment.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const NODE_SIZE = [2, 1, 1];
const SPACING = 5;

const LinkedListAssessment = () => {
  const modes = [
    "intro",
    "singly-1",
    "singly-2",
    "singly-3",
    "doubly-1",
    "doubly-2",
    "doubly-3",
    "circular-1",
    "circular-2",
    "circular-3",
    "done",
  ];

  const [modeIndex, setModeIndex] = useState(0);
  const mode = modes[modeIndex];
  const [score, setScore] = useState(0);
  const totalAssessments = 9;

  const [nodes, setNodes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (mode === "intro") {
      setNodes([]);
      setPositions([]);
    } else if (mode !== "done") {
      generateNodes();
    }
    setSelectedIndex(null);
    setFeedback(null);
    setHighlightedIndex(-1);
  }, [modeIndex]);

  const generateNodes = () => {
    const n = Math.floor(Math.random() * 3) + 4; // 4-6 nodes
    const vals = Array.from({ length: n }, () =>
      Math.floor(Math.random() * 90 + 10)
    );
    setNodes(vals);

    const mid = (n - 1) / 2;
    setPositions(vals.map((_, i) => [(i - mid) * SPACING, 0, 0]));
  };

  const nextMode = () =>
    setModeIndex((m) => Math.min(m + 1, modes.length - 1));

  const getAnswerIndex = () => {
    const len = nodes.length;
    switch (true) {
      case mode.startsWith("singly"):
        return Math.floor(Math.random() * len);
      case mode.startsWith("doubly"):
        return Math.floor(Math.random() * len);
      case mode.startsWith("circular"):
        return Math.floor(Math.random() * len);
      default:
        return 0;
    }
  };

  const questionPrompt = () => {
    if (mode.startsWith("singly")) {
      return `Singly Linked List — Click the node ${getAnswerIndex()} steps from head`;
    }
    if (mode.startsWith("doubly")) {
      return `Doubly Linked List — Click the node ${getAnswerIndex()} from head or tail`;
    }
    if (mode.startsWith("circular")) {
      return `Circular Linked List — Start from head and move ${getAnswerIndex()} steps, which node do you reach?`;
    }
    return "";
  };

  const handleNodeClick = (i) => {
    if (mode === "intro") {
      nextMode();
      return;
    }
    if (mode === "done") return;

    const correctIndex = getAnswerIndex();
    setSelectedIndex(i);

    if (i === correctIndex) {
      setScore((s) => s + 1);
      showFeedback(true, `Correct — Node ${nodes[i]}`);
    } else {
      showFeedback(false, `Incorrect — Node ${nodes[i]}`);
    }

    animateTraversal(correctIndex, () => {
      setTimeout(nextMode, 800);
    });
  };

  const showFeedback = (correct, text) => {
    setFeedback({ correct, text });
    setTimeout(() => setFeedback(null), 1000);
  };

  const animateTraversal = (targetIndex, callback) => {
    let idx = 0;
    const interval = setInterval(() => {
      setHighlightedIndex(idx);
      idx++;
      if (idx > targetIndex) {
        clearInterval(interval);
        callback && callback();
      }
    }, 400);
  };

  return (
    <div className="w-full h-[400px]">
      <Canvas camera={{ position: [0, 5, 18], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <FadeText
          text={
            mode === "intro"
              ? "Linked List Assessment"
              : mode === "done"
              ? "Assessment Complete!"
              : `Assessment ${modeIndex}: ${mode.toUpperCase()}`
          }
          position={[0, 4, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        <FadeText
          text={
            mode === "intro"
              ? "Click below to start"
              : mode === "done"
              ? `Score: ${score} / ${totalAssessments}`
              : questionPrompt()
          }
          position={[0, 3.2, 0]}
          fontSize={0.35}
          color="white"
        />

        {mode === "intro" && (
          <StartBox position={[0, 0, 0]} onClick={() => handleNodeClick(0)} />
        )}

        {mode !== "intro" &&
          mode !== "done" &&
          nodes.map((val, idx) => (
            <Node3D
              key={idx}
              value={val}
              position={positions[idx]}
              selected={selectedIndex === idx}
              highlighted={idx <= highlightedIndex}
              isLast={idx === nodes.length - 1}
              onClick={() => handleNodeClick(idx)}
              type={mode.split("-")[0]} // singly/doubly/circular
            />
          ))}

        {feedback && (
          <FloatingFeedback
            text={feedback.text}
            correct={feedback.correct}
            position={[0, 2, 0]}
          />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// --- Start Box ---
const StartBox = ({ position = [0, 0, 0], onClick }) => {
  const size = [5, 2, 1];
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]} onClick={onClick}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <Text
        position={[0, 0, 0.5]}
        fontSize={0.45}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Start Assessment
      </Text>
    </group>
  );
};

// --- Node3D ---
const Node3D = ({ value, position, selected, highlighted, onClick, isLast, type }) => {
  const boxHalf = NODE_SIZE[0] / 2;
  return (
    <group position={position}>
      <mesh onClick={onClick}>
        <boxGeometry args={NODE_SIZE} />
        <meshStandardMaterial
          color={selected ? "#f87171" : highlighted ? "#fde68a" : "#60a5fa"}
        />
      </mesh>
      <Text
        position={[0, NODE_SIZE[1] + 0.2, 0]}
        fontSize={0.32}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
      >
        {`Node "${value}"`}
      </Text>

      {/* Next pointer */}
      {!isLast && (
        <Arrow3D
          start={[boxHalf, 0, 0]}
          end={[boxHalf + 2, 0, 0]}
          highlighted={highlighted}
        />
      )}

      {/* Circular link */}
      {type === "circular" && isLast && (
        <Arrow3D
          start={[boxHalf, 0, 0]}
          end={[-(position[0]), 0, 0]}
          highlighted={highlighted}
        />
      )}

      {/* Doubly pointer */}
      {type === "doubly" && !isLast && (
        <Arrow3D
          start={[-boxHalf, 0, 0]}
          end={[-boxHalf - 2, 0, 0]}
          highlighted={highlighted}
        />
      )}
    </group>
  );
};

// --- Arrow3D ---
const Arrow3D = ({ start, end, highlighted }) => {
  const ref = useRef();
  const dir = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]).normalize();
  const length = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]).length();

  useFrame(() => {
    if (ref.current) {
      ref.current.setDirection(dir);
      ref.current.setLength(length, 0.4, 0.2);
    }
  });

  return (
    <primitive
      object={new THREE.ArrowHelper(dir, new THREE.Vector3(...start), length, highlighted ? "yellow" : "white")}
      ref={ref}
    />
  );
};

// --- FloatingFeedback ---
const FloatingFeedback = ({ text, correct = true, position = [0, 0, 0] }) => {
  return (
    <group position={position}>
      <Text
        fontSize={0.36}
        color={correct ? "#10b981" : "#ef4444"}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

// --- FadeText ---
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 700;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [text]);

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

export default LinkedListAssessment;
