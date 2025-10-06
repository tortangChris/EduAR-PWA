import React, { useEffect, useRef, useState } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import correctSfx from "/sounds/correct.mp3";
import wrongSfx from "/sounds/wrong.mp3";

const AssessmentAR = () => {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (!navigator.xr) {
      alert("WebXR not available in this browser.");
      setIsSupported(false);
      return;
    }

    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
      if (!supported) {
        alert("AR not supported on this device.");
        setIsSupported(false);
      }
    });
  }, []);

  if (!isSupported) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black text-white">
        <p>⚠️ AR not supported on this device.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 1.5, 12], fov: 60 }}
        gl={{ alpha: true }}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;

          // ✅ Properly request AR session and bind after success
          navigator.xr
            .requestSession("immersive-ar", {
              requiredFeatures: ["local-floor", "hit-test"],
            })
            .then((session) => {
              gl.xr.setReferenceSpaceType("local-floor");

              // Required to render AR to camera background
              gl.xr.setSession(session);
              console.log("✅ AR session started");

              // Debugging confirmation
              alert("✅ AR session started successfully!");

              // Add event listener here — after XR session truly starts
              session.addEventListener("select", (event) => {
                console.log("🟢 XR SELECT EVENT:", event);
                alert("Tap detected in AR mode!");
              });
            })
            .catch((err) => {
              console.error("❌ AR session failed:", err);
              alert("AR session failed. Check camera permissions.");
            });
        }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 10, 5]} intensity={1.2} />
        <ARScene />
      </Canvas>
    </div>
  );
};

const ARScene = () => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [playCorrect] = useSound(correctSfx, { volume: 0.5 });
  const [playWrong] = useSound(wrongSfx, { volume: 0.5 });
  const refs = useRef([]);

  const questions = [
    {
      question: "Accessing an array element by index has what complexity?",
      choices: [
        { text: "O(1)", correct: true },
        { text: "O(n)", correct: false },
        { text: "O(log n)", correct: false },
      ],
    },
    {
      question: "Deleting first element of an array has what complexity?",
      choices: [
        { text: "O(1)", correct: false },
        { text: "O(n)", correct: true },
        { text: "O(log n)", correct: false },
      ],
    },
  ];

  const spacing = 2.5;
  const mid = (questions[currentQ].choices.length - 1) / 2;

  return (
    <group position={[0, 1, -12]} scale={[0.15, 0.15, 0.15]}>
      <Text
        position={[0, 25, 0]}
        fontSize={2.5}
        color="yellow"
        anchorX="center"
      >
        Question {currentQ + 1}
      </Text>
      <Text
        position={[0, 17, 0]}
        fontSize={3}
        color="white"
        anchorX="center"
        maxWidth={80}
      >
        {questions[currentQ].question}
      </Text>

      {questions[currentQ].choices.map((ch, i) => (
        <Choice
          key={i}
          label={ch.text}
          correct={ch.correct}
          position={[(i - mid) * spacing * 6, 0, 0]}
          refCallback={(ref) => (refs.current[i] = ref)}
        />
      ))}
    </group>
  );
};

const Choice = ({ label, correct, position, refCallback }) => {
  const meshRef = useRef();
  useEffect(() => {
    if (refCallback) refCallback(meshRef);
  }, [refCallback]);

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[6, 6, 6]} />
        <meshStandardMaterial color="#60a5fa" emissive="black" />
      </mesh>
      <Text position={[0, 7, 0]} fontSize={2.5} color="white" anchorX="center">
        {label}
      </Text>
    </group>
  );
};

export default AssessmentAR;
