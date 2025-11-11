import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const ARPage2 = ({ data = [35, 10, 25, 5, 15], spacing = 2 }) => {
  const [array, setArray] = useState(data);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSorting, setIsSorting] = useState(false);
  const [swapPair, setSwapPair] = useState([]);
  const [finished, setFinished] = useState(false);

  const boxRefs = useRef([]);

  const heights = useMemo(() => {
    const maxVal = Math.max(...array);
    return array.map((v) => (v / maxVal) * 2 + 0.5);
  }, [array]);

  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

  const handleReset = () => {
    setArray([...data]);
    setFinished(false);
    setIsSorting(false);
    setSwapPair([]);
    setCurrentStep(0);
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const handleStartSort = async () => {
    if (isSorting) return;
    if (finished) {
      handleReset();
      return;
    }

    setIsSorting(true);
    let tempArray = [...array];
    const n = tempArray.length;

    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        setSwapPair([j, j + 1]);
        await sleep(700);

        if (tempArray[j] > tempArray[j + 1]) {
          [tempArray[j], tempArray[j + 1]] = [tempArray[j + 1], tempArray[j]];
          setArray([...tempArray]);
          await sleep(700);
        }
      }
    }

    setSwapPair([]);
    setFinished(true);
    setIsSorting(false);
  };

  const generateCode = () => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "array = [35, 10, 25, 5, 15]",
      "n = length(array)",
      "",
      "for i = 0 to n-1:",
      "    for j = 0 to n-i-1:",
      "        if array[j] > array[j+1]:",
      "            swap(array[j], array[j+1])",
      "",
      `print('Sorted Array:', [${[...array]
        .sort((a, b) => a - b)
        .join(", ")}])`,
      "",
      "// Result: [5, 10, 15, 25, 35]",
    ].join("\n");
  };

  // AR start
  const startAR = (gl) => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          navigator.xr
            .requestSession("immersive-ar", {
              requiredFeatures: ["hit-test", "local-floor"],
            })
            .then((session) => {
              gl.xr.setSession(session);
            })
            .catch((err) => console.error("AR session failed:", err));
        } else {
          console.warn("AR not supported on this device.");
        }
      });
    }
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas
        camera={{ position: [0, 5, 13], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          startAR(gl);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        {/* Header */}
        <FadeText
          text="Bubble Sort Algorithm (O(n²))"
          position={[0, 4.5, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        {/* Instruction */}
        <FadeText
          text={
            finished
              ? "Sorting completed! Tap any box to reset."
              : isSorting
              ? "Sorting in progress..."
              : "Tap any box to start Bubble Sort"
          }
          position={[0, 3.8, 0]}
          fontSize={0.35}
          color="white"
        />

        {/* Boxes */}
        {array.map((value, i) => (
          <AnimatedBox
            key={i}
            index={i}
            value={value}
            height={heights[i]}
            position={positions[i]}
            highlighted={swapPair.includes(i)}
            sorted={finished}
            onClick={handleStartSort}
            ref={addBoxRef}
          />
        ))}

        {/* Code Panel */}
        {finished && <CodePanel code={generateCode()} position={[7.8, 1, 0]} />}

        {/* AR Interaction */}
        <ARInteractionManager boxRefs={boxRefs} onClick={handleStartSort} />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// AnimatedBox with forwardRef for AR raycasting
const AnimatedBox = React.forwardRef(
  ({ index, value, height, position, highlighted, sorted, onClick }, ref) => {
    const meshRef = useRef();
    const targetY = height / 2;
    const normalColor = sorted ? "#34d399" : "#60a5fa";
    const highlightColor = "#f87171";
    const targetColor = highlighted
      ? new THREE.Color(highlightColor)
      : new THREE.Color(normalColor);

    useFrame(() => {
      if (!meshRef.current) return;
      meshRef.current.position.x +=
        (position[0] - meshRef.current.position.x) * 0.15;
      meshRef.current.position.y +=
        (targetY - meshRef.current.position.y) * 0.15;
      meshRef.current.material.color.lerp(targetColor, 0.2);
    });

    return (
      <group
        ref={(g) => {
          if (g) g.userData = { index };
          if (typeof ref === "function") ref(g);
          else if (ref) ref.current = g;
        }}
        position={[position[0], 0, 0]}
      >
        <mesh ref={meshRef} onClick={onClick}>
          <boxGeometry args={[1.6, height, 1]} />
          <meshStandardMaterial
            color={highlighted ? highlightColor : normalColor}
            emissive={highlighted ? "#fbbf24" : "#000000"}
            emissiveIntensity={highlighted ? 0.5 : 0}
          />
        </mesh>

        <Text
          position={[0, height + 0.3, 0]}
          fontSize={0.35}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {String(value)}
        </Text>
      </group>
    );
  }
);

// AR Interaction Manager
const ARInteractionManager = ({ boxRefs, onClick }) => {
  const { gl } = useThree();

  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      const handleSelect = () => {
        const xrCamera = gl.xr.getCamera();
        const raycaster = new THREE.Raycaster();
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        const dir = new THREE.Vector3(0, 0, -1)
          .applyQuaternion(cam.quaternion)
          .normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        raycaster.set(origin, dir);

        const candidates = (boxRefs.current || [])
          .map((g) => (g ? g.children : []))
          .flat();
        const intersects = raycaster.intersectObjects(candidates, true);

        if (intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && hit.userData?.index === undefined && hit.parent)
            hit = hit.parent;
          if (hit?.userData?.index !== undefined) onClick();
        }
      };

      session.addEventListener("select", handleSelect);
      const onEnd = () => session.removeEventListener("select", handleSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, boxRefs, onClick]);

  return null;
};

// Code Panel
const CodePanel = ({ code, position }) => (
  <FadeText text={code} position={position} fontSize={0.3} color="#c7d2fe" />
);

// Fade Text
const FadeText = ({ text, position, fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    let frame;
    let start;
    const duration = 1000;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Text
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      fillOpacity={opacity}
      maxWidth={10}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

export default ARPage2;
