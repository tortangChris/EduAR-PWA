// LinkedListAssessment.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const LinkedListAssessment = () => {
  const questions = [
    {
      question:
        "Example: Cube A → Cube B → Cube C (one direction only). What type of linked list is this?",
      choices: [
        { label: "Singly", type: "cube", isCorrect: true },
        { label: "Doubly", type: "cube", isCorrect: false },
        { label: "Circular", type: "cube", isCorrect: false },
      ],
    },
    {
      question: "In a Doubly Linked List, in which directions can we traverse?",
      choices: [
        { label: "Forward only", type: "sphere", isCorrect: false },
        { label: "Backward only", type: "sphere", isCorrect: false },
        { label: "Both forward & backward", type: "sphere", isCorrect: true },
      ],
    },
    {
      question:
        "Cube A → Cube B → Cube C → back to Cube A. What makes this list circular?",
      choices: [
        {
          label: "Last node points back to head",
          type: "sphere",
          isCorrect: true,
        },
        {
          label: "It has both next and prev pointers",
          type: "sphere",
          isCorrect: false,
        },
        { label: "Nodes can’t be deleted", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "If you insert a node at the head of Singly Linked List [10 → 20 → 30], what will be the new head?",
      choices: [
        { label: "10", type: "cube", isCorrect: false },
        { label: "20", type: "cube", isCorrect: false },
        { label: "New Node", type: "cube", isCorrect: true },
      ],
    },
    {
      question:
        "In Doubly Linked List [A ↔ B ↔ C], if you delete B, which nodes are connected next?",
      choices: [
        { label: "A → B → C", type: "sphere", isCorrect: false },
        { label: "A ↔ C", type: "sphere", isCorrect: true },
        { label: "B ↔ C", type: "sphere", isCorrect: false },
      ],
    },
    {
      question: "Singly Linked List [1 → 2 → 3]. What is the last node?",
      choices: [
        { label: "1", type: "cube", isCorrect: false },
        { label: "2", type: "cube", isCorrect: false },
        { label: "3", type: "cube", isCorrect: true },
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

  const spacing = 3;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <div className="w-full h-[300px]">
      <Canvas camera={{ position: [0, 3, 8], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Question Indicator */}
        <Text
          position={[0, 3.3, 0]}
          fontSize={0.25}
          color="yellow"
          anchorX="center"
          anchorY="middle"
        >
          {`Question ${currentQ + 1} of ${questions.length}`}
        </Text>

        {/* Question */}
        <Text
          position={[0, 2.5, 0]}
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

export default LinkedListAssessment;
