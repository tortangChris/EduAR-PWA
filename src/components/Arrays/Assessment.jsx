import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const Assessment = () => {
  const questions = [
    {
      question:
        "Accessing an element in an array by index has what time complexity?",
      choices: [
        { label: "O(1)", type: "cube", isCorrect: true },
        { label: "O(n)", type: "cube", isCorrect: false },
        { label: "O(log n)", type: "cube", isCorrect: false },
      ],
    },
    {
      question:
        "Inserting an element at the end of an array (without resizing) has what complexity?",
      choices: [
        { label: "O(1)", type: "sphere", isCorrect: true },
        { label: "O(n)", type: "sphere", isCorrect: false },
        { label: "O(log n)", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Deleting an element from the beginning of an array has what complexity?",
      choices: [
        { label: "O(1)", type: "cube", isCorrect: false },
        { label: "O(n)", type: "cube", isCorrect: true },
        { label: "O(log n)", type: "cube", isCorrect: false },
      ],
    },
    {
      question:
        "Inserting an element in the middle of an array has what complexity?",
      choices: [
        { label: "O(1)", type: "sphere", isCorrect: false },
        { label: "O(n)", type: "sphere", isCorrect: true },
        { label: "O(log n)", type: "sphere", isCorrect: false },
      ],
    },
    {
      question:
        "Searching for an element by value in an unsorted array has what complexity?",
      choices: [
        { label: "O(1)", type: "cube", isCorrect: false },
        { label: "O(n)", type: "cube", isCorrect: true },
        { label: "O(log n)", type: "cube", isCorrect: false },
      ],
    },
    {
      question: "Accessing the last element in an array has what complexity?",
      choices: [
        { label: "O(1)", type: "sphere", isCorrect: true },
        { label: "O(n)", type: "sphere", isCorrect: false },
        { label: "O(log n)", type: "sphere", isCorrect: false },
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

    // Move to next question after 2s
    setTimeout(() => {
      setSelectedIndex(null);
      setCurrentQ((prev) => (prev + 1) % questions.length);
    }, 2000);
  };

  const spacing = 3;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <div className="w-full h-[500px]">
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
          fontSize={0.4}
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
      // Glow effect
      meshRef.current.material.emissive.set(
        selected ? (isCorrect ? "green" : "red") : "black"
      );
      // Slight scaling animation when selected
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

export default Assessment;
