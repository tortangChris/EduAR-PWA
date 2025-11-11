import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const ARInteractionManager = ({ boxRefs, onBoxClick }) => {
  const { gl } = useThree();

  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      const onSelect = () => {
        const xrCamera = gl.xr.getCamera();
        const raycaster = new THREE.Raycaster();
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        const dir = new THREE.Vector3(0, 0, -1)
          .applyQuaternion(cam.quaternion)
          .normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        raycaster.set(origin, dir);

        const candidates = (boxRefs.current || [])
          .map((g) => g.children || [])
          .flat();
        const intersects = raycaster.intersectObjects(candidates, true);

        if (intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && hit.userData?.boxIndex === undefined && hit.parent) {
            hit = hit.parent;
          }
          const idx = hit?.userData?.boxIndex;
          if (idx !== undefined) onBoxClick(idx);
        }
      };

      session.addEventListener("select", onSelect);
      const onEnd = () => session.removeEventListener("select", onSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, boxRefs, onBoxClick]);

  return null;
};

// === Main Component ===
const ARPage3 = ({ data = [30, 10, 20, 5, 15], spacing = 2 }) => {
  const [array, setArray] = useState(data);
  const [isSorting, setIsSorting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [highlight, setHighlight] = useState([]);
  const boxRefs = useRef([]);

  const heights = useMemo(() => {
    const maxVal = Math.max(...array);
    return array.map((v) => (v / maxVal) * 2 + 0.5);
  }, [array]);

  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const handleReset = () => {
    setArray([...data]);
    setFinished(false);
    setIsSorting(false);
    setHighlight([]);
  };

  const handleStartSort = async () => {
    if (isSorting) return;
    if (finished) return handleReset();

    setIsSorting(true);
    let tempArray = [...array];

    for (let i = 1; i < tempArray.length; i++) {
      let key = tempArray[i];
      let j = i - 1;
      setHighlight([i]);
      await sleep(700);

      while (j >= 0 && tempArray[j] > key) {
        setHighlight([j, j + 1]);
        tempArray[j + 1] = tempArray[j];
        setArray([...tempArray]);
        j--;
        await sleep(700);
      }

      tempArray[j + 1] = key;
      setArray([...tempArray]);
      await sleep(700);
    }

    setHighlight([]);
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
      "for i = 1 to n-1:",
      "    key = array[i]",
      "    j = i - 1",
      "    while j >= 0 and array[j] > key:",
      "        array[j+1] = array[j]",
      "        j = j - 1",
      "    array[j+1] = key",
      "",
      `print('Sorted Array:', [${[...array]
        .sort((a, b) => a - b)
        .join(", ")}])`,
    ].join("\n");
  };

  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

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
        camera={{ position: [0, 4, 25], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          startAR(gl);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        <FadeText
          text="Insertion Sort Algorithm (O(n²))"
          position={[0, 4.5, 0]}
          fontSize={0.6}
          color="#facc15"
        />

        <FadeText
          text={
            finished
              ? "Sorting completed! Tap any box to reset."
              : isSorting
              ? "Sorting in progress..."
              : "Tap any box to start Insertion Sort"
          }
          position={[0, 3.8, 0]}
          fontSize={0.35}
          color="white"
        />

        {array.map((value, i) => (
          <AnimatedBox
            key={i}
            index={i}
            value={value}
            height={heights[i]}
            position={positions[i]}
            highlighted={highlight.includes(i)}
            sorted={finished}
            onClick={handleStartSort}
            ref={addBoxRef}
          />
        ))}

        {finished && <CodePanel code={generateCode()} position={[7.8, 1, 0]} />}

        <ARInteractionManager boxRefs={boxRefs} onBoxClick={handleStartSort} />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === Animated Box ===
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

    useEffect(() => {
      if (meshRef.current) meshRef.current.userData = { boxIndex: index };
      if (ref) {
        if (typeof ref === "function") ref(meshRef.current);
        else ref.current = meshRef.current;
      }
    }, [index, ref]);

    return (
      <group position={position}>
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

// === Code Panel ===
const CodePanel = ({ code, position }) => (
  <FadeText text={code} position={position} fontSize={0.3} color="#c7d2fe" />
);

// === Fade Text ===
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

export default ARPage3;
