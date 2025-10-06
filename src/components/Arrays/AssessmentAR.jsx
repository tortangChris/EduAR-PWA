import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const AssessmentAR = () => {
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
                requiredFeatures: ["local-floor", "hit-test"],
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
    alert("use effect triggered");
    const session = gl.xr.getSession?.();
    if (!session) return;

    alert("session passed");
    const onSelect = (event) => {
      alert("✅ AR select triggered!");
      console.log("AR select event:", event);

      const inputSource = event.inputSource;
      if (inputSource.targetRayMode !== "screen") return;

      const frame = event.frame;
      const referenceSpace = gl.xr.getReferenceSpace();
      if (!frame || !referenceSpace) return;

      const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
      if (!pose) return;

      const origin = new THREE.Vector3().fromArray(
        pose.transform.position.toArray()
      );
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
        new THREE.Quaternion().fromArray(pose.transform.orientation.toArray())
      );

      raycaster.current.set(origin, direction);

      const intersects = raycaster.current.intersectObjects(
        choiceRefs.current.map((r) => r.meshRef.current)
      );

      if (intersects.length > 0) {
        const tappedIndex = choiceRefs.current.findIndex(
          (ref) => ref.meshRef.current === intersects[0].object
        );
        if (tappedIndex >= 0) {
          handleSelect(questions[currentQ].choices[tappedIndex], tappedIndex);
        }
      }
    };

    session.addEventListener("select", onSelect);

    // Fallback for desktop testing
    const onClick = () => {
      alert("✅ Desktop click triggered!");
      console.log("Desktop click detected");
    };
    window.addEventListener("click", onClick);

    return () => {
      session.removeEventListener("select", onSelect);
      window.removeEventListener("click", onClick);
    };
  }, [gl, currentQ]);

  const spacing = 2.5;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <group position={[0, 1, -12]} scale={[0.15, 0.15, 0.15]}>
      <mesh position={[0, 0, -5]}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color="white" transparent opacity={0.9} />
      </mesh>

      <Text
        position={[0, 25, 0]}
        fontSize={2.5}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        {`Question ${currentQ + 1} of ${questions.length}`}
      </Text>

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

      {questions[currentQ].choices.map((choice, i) => (
        <Choice
          key={i}
          refCallback={(ref) => {
            choiceRefs.current[i] = ref;
          }}
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
  const [scaleTarget, setScaleTarget] = useState(1);

  useEffect(() => {
    if (refCallback) refCallback({ meshRef });
  }, [refCallback]);

  useEffect(() => {
    if (selected) {
      setScaleTarget(1.3);
      meshRef.current.material.emissive.set(isCorrect ? "green" : "red");

      const timeout = setTimeout(() => {
        setScaleTarget(1);
        meshRef.current.material.emissive.set("black");
      }, 500);

      return () => clearTimeout(timeout);
    } else {
      setScaleTarget(1);
      if (meshRef.current) meshRef.current.material.emissive.set("black");
    }
  }, [selected]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.lerp(
        new THREE.Vector3(scaleTarget, scaleTarget, scaleTarget),
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

export default AssessmentAR;
