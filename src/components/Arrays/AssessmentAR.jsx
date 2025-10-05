import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const AssessmentARInteractive = () => {
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

    // Move to next question after 2 seconds
    setTimeout(() => {
      setSelectedIndex(null);
      setCurrentQ((prev) => (prev + 1) % questions.length);
    }, 2000);
  };

  const spacing = 3;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 2, 10], fov: 55 }} // ✅ moved slightly farther
        gl={{ alpha: true }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"],
              })
              .then((session) => gl.xr.setSession(session))
              .catch((err) => console.error("❌ AR session failed:", err));
          }
        }}
        onPointerDown={(e) => {
          const object = e.intersections[0]?.object;
          if (object && object.userData.onSelect) object.userData.onSelect();
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* AR Group */}
        <group position={[0, 1, -2]} scale={[0.12, 0.12, 0.12]}>
          {/* Question Number */}
          <Text
            position={[0, 22, 0]}
            fontSize={2.5}
            color="yellow"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            strokeColor="black"
            strokeWidth={0.08}
          >
            {`Question ${currentQ + 1} of ${questions.length}`}
          </Text>

          {/* Question Text */}
          <Text
            position={[0, 16, 0]}
            fontSize={3}
            color="white"
            anchorX="center"
            anchorY="middle"
            maxWidth={80}
            lineHeight={1.3}
            fontWeight="bold"
            strokeColor="black"
            strokeWidth={0.08}
          >
            {questions[currentQ].question}
          </Text>

          {/* Choices */}
          {questions[currentQ].choices.map((choice, i) => (
            <ChoiceInteractive
              key={i}
              geometry={choice.type}
              position={[(i - mid) * spacing * 6, 0, 0]}
              label={choice.label}
              isCorrect={choice.isCorrect}
              selected={selectedIndex === i}
              onSelect={() => handleSelect(choice, i)}
            />
          ))}

          {/* Ground plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
};

// ✅ Choice with tap + optional drag
const ChoiceInteractive = ({
  geometry,
  position,
  label,
  isCorrect,
  selected,
  onSelect,
}) => {
  const meshRef = useRef();
  const [isDragging, setIsDragging] = useState(false);
  const { camera } = useThree();

  useFrame(() => {
    if (meshRef.current) {
      // Glow color on select
      meshRef.current.material.emissive.set(
        selected ? (isCorrect ? "green" : "red") : "black"
      );
      // Smooth scale transition
      const targetScale = selected ? 1.3 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  const handlePointerDown = () => {
    if (onSelect) onSelect(); // tap to select (no drag unless needed)
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const vec = new THREE.Vector3(e.point.x, e.point.y, e.point.z);
    meshRef.current.position.copy(vec);
  };

  const handlePointerUp = () => setIsDragging(false);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        castShadow
        receiveShadow
      >
        {geometry === "cube" ? (
          <boxGeometry args={[6, 6, 6]} />
        ) : (
          <sphereGeometry args={[3.5, 32, 32]} />
        )}
        <meshStandardMaterial color="#60a5fa" />
      </mesh>

      <Text
        position={[0, 7, 0]}
        fontSize={2.5}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        strokeColor="black"
        strokeWidth={0.05}
      >
        {label}
      </Text>
    </group>
  );
};

export default AssessmentARInteractive;
