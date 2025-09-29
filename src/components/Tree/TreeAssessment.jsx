// TreeAssessment.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const TreeAssessment = () => {
  const questions = [
    {
      question: "Which cube is the root?",
      choices: [
        { label: "10", type: "cube", isCorrect: true },
        { label: "20", type: "cube", isCorrect: false },
        { label: "30", type: "cube", isCorrect: false },
      ],
    },
    {
      question: "Which node(s) are leaves? (Tap all that apply)",
      multiple: true,
      choices: [
        { label: "20", type: "cube", isCorrect: false },
        { label: "30", type: "cube", isCorrect: true },
        { label: "40", type: "cube", isCorrect: true },
      ],
    },
    {
      question:
        "Node A with 2 children → Binary Tree. Node A with 3 children → Non-Binary Tree. What type of tree is this?",
      choices: [
        { label: "Binary", type: "cube", isCorrect: true },
        { label: "Non-Binary", type: "cube", isCorrect: false },
      ],
    },
    {
      question: "In level-order traversal, which node is visited first?",
      choices: [
        { label: "1", type: "cube", isCorrect: true },
        { label: "2", type: "cube", isCorrect: false },
        { label: "3", type: "cube", isCorrect: false },
      ],
    },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });

  const handleSelect = (choice, index) => {
    const isMulti = questions[currentQ].multiple;
    if (isMulti) {
      // Toggle selection
      setSelectedIndices((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setSelectedIndices([index]);
      if (choice.isCorrect) playCorrect();
      else playWrong();

      setTimeout(() => {
        setSelectedIndices([]);
        setCurrentQ((prev) => (prev + 1) % questions.length);
      }, 2000);
    }
  };

  const handleSubmitMulti = () => {
    const allCorrect =
      selectedIndices.every((i) => questions[currentQ].choices[i].isCorrect) &&
      selectedIndices.length ===
        questions[currentQ].choices.filter((c) => c.isCorrect).length;

    if (allCorrect) playCorrect();
    else playWrong();

    setTimeout(() => {
      setSelectedIndices([]);
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
            selected={selectedIndices.includes(i)}
            onSelect={() => handleSelect(choice, i)}
          />
        ))}

        {/* Submit button for multi-select */}
        {questions[currentQ].multiple && (
          <Text
            position={[0, -2, 0]}
            fontSize={0.3}
            color="orange"
            anchorX="center"
            anchorY="middle"
            onClick={handleSubmitMulti}
          >
            Submit
          </Text>
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

export default TreeAssessment;
