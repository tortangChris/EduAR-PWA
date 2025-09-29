// GraphAssessment.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const GraphAssessment = () => {
  const questions = [
    {
      question: "AR Scene: Arrows on edges. What type of graph is this?",
      choices: [
        { label: "Directed", type: "sphere", isCorrect: true },
        { label: "Undirected", type: "sphere", isCorrect: false },
      ],
    },
    {
      question: "Node A connected to B, C, D. What is the degree of node A?",
      choices: [
        { label: "2", type: "sphere", isCorrect: false },
        { label: "3", type: "sphere", isCorrect: true },
        { label: "4", type: "sphere", isCorrect: false },
      ],
    },
    {
      question: "Edge X-Y labeled with weight 5. What does weight 5 represent?",
      choices: [
        { label: "Number of nodes", type: "sphere", isCorrect: false },
        { label: "Cost/distance of the edge", type: "sphere", isCorrect: true },
        { label: "Degree of X", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Graph: A-B-C. In BFS starting at A, which node is visited first after A?",
      choices: [
        { label: "B", type: "sphere", isCorrect: true },
        { label: "C", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Graph: A-B-C. In DFS starting at A, which node is visited first?",
      choices: [
        { label: "B", type: "sphere", isCorrect: true },
        { label: "C", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Adding a new vertex to an empty graph increases number of vertices by?",
      choices: [
        { label: "0", type: "sphere", isCorrect: false },
        { label: "1", type: "sphere", isCorrect: true },
        { label: "Depends on edges", type: "sphere", isCorrect: false },
      ],
    },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });

  const handleSelect = (choice, index) => {
    setSelectedIndex(index);
    if (choice.isCorrect) playCorrect();
    else playWrong();

    setTimeout(() => {
      setSelectedIndex(null);
      setCurrentQ((prev) => (prev + 1) % questions.length);
    }, 2000);
  };

  const spacing = 4;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 4, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Question Indicator */}
        <Text
          position={[0, 3.5, 0]}
          fontSize={0.25}
          color="yellow"
          anchorX="center"
          anchorY="middle"
        >
          {`Question ${currentQ + 1} of ${questions.length}`}
        </Text>

        {/* Question */}
        <Text
          position={[0, 2.8, 0]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {questions[currentQ].question}
        </Text>

        {/* Choices */}
        {questions[currentQ].choices.map((choice, i) => (
          <Choice
            key={i}
            geometry={choice.type}
            position={[(i - mid) * spacing, 0, 0]}
            label={choice.label}
            isCorrect={choice.isCorrect}
            selected={selectedIndex === i}
            onSelect={() => handleSelect(choice, i)}
          />
        ))}

        {/* Example edges for visualization */}
        {currentQ === 0 && (
          <Line
            points={[
              [0, 0, 0],
              [2, 0, 0],
            ]}
            color="white"
            lineWidth={2}
          />
        )}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

const Choice = ({
  geometry,
  position,
  label,
  isCorrect,
  selected,
  onSelect,
}) => {
  const meshRef = useRef();

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.material.emissive.set(
        selected ? (isCorrect ? "green" : "red") : "black"
      );
      const targetScale = selected ? 1.3 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} onClick={onSelect}>
        {geometry === "cube" ? (
          <boxGeometry args={[1, 1, 1]} />
        ) : (
          <sphereGeometry args={[0.7, 32, 32]} />
        )}
        <meshStandardMaterial color="#60a5fa" />
      </mesh>
      <Text
        position={[0, 1, 0]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
};

export default GraphAssessment;
