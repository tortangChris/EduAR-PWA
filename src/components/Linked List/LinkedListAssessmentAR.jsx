// LinkedListAssessmentAR.jsx
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const LinkedListAssessmentAR = () => {
  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 1.5, 12], fov: 60 }}
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
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
        <AssessmentScene />
      </Canvas>
    </div>
  );
};

const AssessmentScene = () => {
  const { gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const choiceRefs = useRef([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });

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
  ];

  const spacing = 2.5;
  const mid = (questions[currentQ].choices.length - 1) / 2;
  choiceRefs.current = [];

  const handleSelect = (choice, index) => {
    setSelectedIndex(index);
    if (choice.isCorrect) playCorrect();
    else playWrong();

    setTimeout(() => {
      setSelectedIndex(null);
      setCurrentQ((prev) => (prev + 1) % questions.length);
    }, 2000);
  };

  useEffect(() => {
    const session = gl.xr.getSession?.();
    if (!session) return;

    const onSelectStart = (event) => {
      const inputSource = event.inputSource;
      const referenceSpace = gl.xr.getReferenceSpace();
      const frame = event.frame;
      if (frame && referenceSpace) {
        const targetRayPose = frame.getPose(
          inputSource.targetRaySpace,
          referenceSpace
        );
        if (targetRayPose) {
          const origin = new THREE.Vector3().fromArray(
            targetRayPose.transform.position.toArray()
          );
          const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
            new THREE.Quaternion().fromArray(
              targetRayPose.transform.orientation.toArray()
            )
          );
          raycaster.current.set(origin, direction);

          const intersects = raycaster.current.intersectObjects(
            choiceRefs.current.map((r) => r.meshRef.current),
            false
          );

          if (intersects.length > 0) {
            const object = intersects[0].object;
            const tappedIndex = choiceRefs.current.findIndex(
              (ref) => ref.meshRef.current === object
            );
            if (tappedIndex >= 0)
              handleSelect(
                questions[currentQ].choices[tappedIndex],
                tappedIndex
              );
          }
        }
      }
    };

    session.addEventListener("selectstart", onSelectStart);
    return () => session.removeEventListener("selectstart", onSelectStart);
  }, [gl, currentQ]);

  return (
    <group position={[0, 1, -12]} scale={[0.3, 0.3, 0.3]}>
      {/* 3D Crosshair */}
      <mesh position={[0, 0, -5]}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color="white" transparent opacity={0.9} />
      </mesh>

      {/* Question */}
      <Text
        position={[0, 15, 0]}
        fontSize={3}
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
          refCallback={(ref) => (choiceRefs.current[i] = ref)}
          geometry={choice.type}
          position={[(i - mid) * spacing * 4, 0, 0]}
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

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.material.emissive.set(
        selected ? (isCorrect ? "green" : "red") : "black"
      );
      const targetScale = selected ? 1.2 : 1;
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        0.1
      );
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow receiveShadow>
        {geometry === "cube" ? (
          <boxGeometry args={[6, 6, 6]} />
        ) : (
          <sphereGeometry args={[3.5, 32, 32]} />
        )}
        <meshStandardMaterial color="#60a5fa" emissive="black" />
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

export default LinkedListAssessmentAR;
