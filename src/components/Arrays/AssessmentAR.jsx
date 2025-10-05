import React, { useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const AssessmentARInteractive = () => {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 1.5, 10], fov: 60 }}
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
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <AssessmentScene />
      </Canvas>
    </div>
  );
};

const AssessmentScene = () => {
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
        "Deleting an element from the beginning of an array has what complexity?",
      choices: [
        { label: "O(1)", type: "cube", isCorrect: false },
        { label: "O(n)", type: "cube", isCorrect: true },
        { label: "O(log n)", type: "cube", isCorrect: false },
      ],
    },
  ];

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });
  const choiceRefs = useRef([]);
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  // ✅ Add invisible ray from camera center on tap
  useEffect(() => {
    const handleTap = () => {
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion
      );
      raycaster.current.set(camera.position, direction);

      const intersects = raycaster.current.intersectObjects(
        choiceRefs.current.map((ref) => ref.meshRef.current),
        true
      );

      if (intersects.length > 0) {
        const tappedObject = intersects[0].object;
        const tappedIndex = choiceRefs.current.findIndex(
          (ref) => ref.meshRef.current === tappedObject
        );
        if (tappedIndex >= 0) {
          handleSelect(questions[currentQ].choices[tappedIndex], tappedIndex);
        }
      }
    };

    window.addEventListener("pointerdown", handleTap);
    return () => window.removeEventListener("pointerdown", handleTap);
  }, [currentQ]);

  const handleSelect = (choice, index) => {
    setSelectedIndex(index);
    if (choice.isCorrect) playCorrect();
    else playWrong();

    setTimeout(() => {
      setSelectedIndex(null);
      setCurrentQ((prev) => (prev + 1) % questions.length);
    }, 2000);
  };

  const spacing = 2.5;
  const mid = (questions[currentQ].choices.length - 1) / 2;
  choiceRefs.current = [];

  return (
    <group position={[0, 1, -10]} scale={[0.15, 0.15, 0.15]}>
      {/* ✅ 3D crosshair visible in AR */}
      <mesh position={[0, 0, -5]}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color="white" transparent opacity={0.9} />
      </mesh>

      {/* Question indicator */}
      <Text
        position={[0, 25, 0]}
        fontSize={2.5}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        {`Question ${currentQ + 1} of ${questions.length}`}
      </Text>

      {/* Question text */}
      <Text
        position={[0, 17, 0]}
        fontSize={3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={80}
        lineHeight={1.3}
      >
        {questions[currentQ].question}
      </Text>

      {/* Choices */}
      {questions[currentQ].choices.map((choice, i) => (
        <Choice
          key={i}
          refCallback={(ref) => (choiceRefs.current[i] = ref)}
          geometry={choice.type}
          position={[(i - mid) * spacing * 6, 0, 0]}
          label={choice.label}
          isCorrect={choice.isCorrect}
          selected={selectedIndex === i}
        />
      ))}
    </group>
  );
};

const Choice = ({
  refCallback,
  geometry,
  position,
  label,
  isCorrect,
  selected,
}) => {
  const meshRef = useRef();

  useEffect(() => {
    if (refCallback) refCallback({ meshRef });
  }, [refCallback]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.material.emissive.set(
        selected ? (isCorrect ? "green" : "red") : "black"
      );
      meshRef.current.scale.setScalar(selected ? 1.2 : 1);
    }
  }, [selected]);

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
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
      >
        {label}
      </Text>
    </group>
  );
};

export default AssessmentARInteractive;
