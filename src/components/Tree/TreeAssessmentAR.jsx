// TreeAssessmentAR.jsx
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const TreeAssessmentAR = () => {
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
        <TreeScene />
      </Canvas>
    </div>
  );
};

const TreeScene = () => {
  const { gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const choiceRefs = useRef([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });

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
  ];

  const spacing = 2.5;
  const mid = (questions[currentQ].choices.length - 1) / 2;
  choiceRefs.current = [];

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

          // Submit button tap for multi-select
          if (questions[currentQ].multiple) {
            const submitIntersect = raycaster.current.intersectObject(
              submitRef.current,
              false
            );
            if (submitIntersect.length > 0) handleSubmitMulti();
          }
        }
      }
    };

    session.addEventListener("selectstart", onSelectStart);
    return () => session.removeEventListener("selectstart", onSelectStart);
  }, [gl, currentQ, selectedIndices]);

  const submitRef = useRef();

  return (
    <group position={[0, 1, -12]} scale={[0.3, 0.3, 0.3]}>
      {/* Crosshair */}
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
          selected={selectedIndices.includes(i)}
        />
      ))}

      {/* Submit button for multi-select */}
      {questions[currentQ].multiple && (
        <mesh ref={submitRef} position={[0, -6, 0]}>
          <boxGeometry args={[6, 2, 1]} />
          <meshStandardMaterial color="orange" />
          <Text
            position={[0, 0, 0.6]}
            fontSize={2}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Submit
          </Text>
        </mesh>
      )}
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

export default TreeAssessmentAR;
