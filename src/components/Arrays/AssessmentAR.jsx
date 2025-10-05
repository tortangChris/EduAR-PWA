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
        camera={{ position: [0, 1.5, 4.5], fov: 60 }}
        gl={{ alpha: true }}
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
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />

        <ARScene />
      </Canvas>
    </div>
  );
};

const ARScene = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [flash, setFlash] = useState(false);

  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });

  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());
  const choiceRefs = useRef([]);

  const questions = [
    {
      question:
        "Accessing an element in an array by index has what time complexity?",
      choices: [
        { label: "O(1)", isCorrect: true },
        { label: "O(n)", isCorrect: false },
        { label: "O(log n)", isCorrect: false },
      ],
    },
  ];

  // ✅ Tap detection
  useEffect(() => {
    const handleTap = (event) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      pointer.current.set(x, y);

      raycaster.current.setFromCamera(pointer.current, camera);
      const intersects = raycaster.current.intersectObjects(
        choiceRefs.current.map((ref) => ref.current),
        false
      );

      // flash crosshair briefly
      setFlash(true);
      setTimeout(() => setFlash(false), 200);

      if (intersects.length > 0) {
        const idx = choiceRefs.current.findIndex(
          (ref) => ref.current === intersects[0].object
        );
        if (idx !== -1) {
          const choice = questions[currentQ].choices[idx];
          setSelectedIndex(idx);
          if (choice.isCorrect) playCorrect();
          else playWrong();

          setTimeout(() => setSelectedIndex(null), 1000);
        }
      }
    };

    window.addEventListener("pointerdown", handleTap);
    return () => window.removeEventListener("pointerdown", handleTap);
  }, [currentQ]);

  choiceRefs.current = questions[currentQ].choices.map(() => React.createRef());

  const spacing = 5;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <group position={[0, 1, -6]} scale={[0.12, 0.12, 0.12]}>
      <Text
        position={[0, 22, 0]}
        fontSize={3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Question {currentQ + 1}
      </Text>

      <Text
        position={[0, 16, 0]}
        fontSize={3}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={80}
        lineHeight={1.3}
      >
        {questions[currentQ].question}
      </Text>

      {questions[currentQ].choices.map((c, i) => (
        <mesh
          key={i}
          ref={choiceRefs.current[i]}
          position={[(i - mid) * spacing * 10, 0, 0]}
          scale={selectedIndex === i ? 1.4 : 1}
        >
          <boxGeometry args={[6, 6, 6]} />
          <meshStandardMaterial
            color={
              selectedIndex === i ? (c.isCorrect ? "green" : "red") : "#60a5fa"
            }
            emissive={
              selectedIndex === i ? (c.isCorrect ? "green" : "red") : "black"
            }
          />
          <Text
            position={[0, 7, 0]}
            fontSize={2.5}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {c.label}
          </Text>
        </mesh>
      ))}

      {/* ✅ Crosshair marker at screen center */}
      <Crosshair flash={flash} />
    </group>
  );
};

// ==================
// Crosshair Component
// ==================
const Crosshair = ({ flash }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (flash) {
      setVisible(false);
      setTimeout(() => setVisible(true), 150);
    }
  }, [flash]);

  return visible ? (
    <mesh position={[0, 0, -2]}>
      <ringGeometry args={[0.02, 0.03, 32]} />
      <meshBasicMaterial color="white" />
    </mesh>
  ) : null;
};

export default AssessmentARInteractive;
