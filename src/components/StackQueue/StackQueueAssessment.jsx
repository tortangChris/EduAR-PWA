// StackQueueAssessment.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const StackQueueAssessment = () => {
  const questions = [
    {
      question:
        "Stack: [10] → [20] → [30] (top). If we pop, which element is removed?",
      choices: [
        { label: "10", type: "sphere", isCorrect: false },
        { label: "20", type: "sphere", isCorrect: false },
        { label: "30", type: "sphere", isCorrect: true },
      ],
    },
    {
      question:
        "Queue: [A] → [B] → [C] (front = A). If we dequeue, which element is removed?",
      choices: [
        { label: "A", type: "sphere", isCorrect: true },
        { label: "B", type: "sphere", isCorrect: false },
        { label: "C", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Stack: [5] → [15]. After push(20), which element is now on top?",
      choices: [
        { label: "5", type: "sphere", isCorrect: false },
        { label: "15", type: "sphere", isCorrect: false },
        { label: "20", type: "sphere", isCorrect: true },
      ],
    },
    {
      question:
        "Queue: [X] → [Y]. After enqueue(Z), which element is at the front?",
      choices: [
        { label: "X", type: "sphere", isCorrect: true },
        { label: "Y", type: "sphere", isCorrect: false },
        { label: "Z", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Perform enqueue(5) → enqueue(7) → dequeue(). Which element remains at the front?",
      choices: [
        { label: "5", type: "sphere", isCorrect: false },
        { label: "7", type: "sphere", isCorrect: true },
        { label: "null", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Stacks are FIFO / Queues remove first inserted element. Tap True or False.",
      choices: [
        { label: "True", type: "cube", isCorrect: false },
        { label: "False", type: "cube", isCorrect: true },
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

export default StackQueueAssessment;
