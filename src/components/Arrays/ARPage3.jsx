import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3";

const ARPage3 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [stage, setStage] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [placed, setPlaced] = useState(true);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  // compute box positions
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // timeline (loop every 25s)
  useEffect(() => {
    if (!placed) return;

    const timeline = [
      {
        time: 0,
        action: () => {
          setStage(1);
          setStatusText("");
          play();
        },
      },
      {
        time: 3,
        action: () => {
          setStage(2);
          play();
        },
      },
      {
        time: 6,
        action: () => {
          setStage(3);
          play();
        },
      },
      {
        time: 9,
        action: () => {
          setHighlightIndex(0);
          setStatusText("Checking index 0...");
          play();
        },
      },
      {
        time: 10.5,
        action: () => {
          setHighlightIndex(1);
          setStatusText("Checking index 1...");
          play();
        },
      },
      {
        time: 12,
        action: () => {
          setHighlightIndex(2);
          setStatusText("Found at index 2!");
          play();
          setStage(4);
        },
      },
      {
        time: 18,
        action: () => {
          setStage(5);
          play();
        },
      },
      {
        time: 20,
        action: () => {
          setStage(6);
          play();
        },
      },
    ];

    let timers = timeline.map((t) => setTimeout(t.action, t.time * 1000));

    const loop = setInterval(() => {
      setStage(0);
      setHighlightIndex(null);
      setStatusText("");
      timers.forEach(clearTimeout);
      timers = timeline.map((t) => setTimeout(t.action, t.time * 1000));
    }, 25000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
    };
  }, [play, placed]);

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 2, 4], fov: 50 }}
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
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

        {/* Fixed AR group */}
        <group position={[0, 1, -2]} scale={[0.1, 0.1, 0.1]}>
          {/* Title */}
          <FadeInText
            show={stage >= 1}
            text="Search Operation (O(n))"
            position={[0, 3.5, 0]}
            fontSize={0.6}
            color="white"
          />

          {/* Definition */}
          <FadeInText
            show={stage >= 2}
            text="Searching = looking for an element in the array"
            position={[0, 2.9, 0]}
            fontSize={0.32}
            color="#ffd166"
          />

          {/* Boxes */}
          {stage >= 3 &&
            data.map((value, i) => (
              <Box
                key={i}
                index={i}
                value={value}
                position={positions[i]}
                highlight={highlightIndex === i && stage < 4}
                found={highlightIndex === i && stage >= 4}
              />
            ))}

          {/* Status label */}
          <FadeInText
            show={!!statusText}
            text={statusText}
            position={[0, -1.5, 0]}
            fontSize={0.35}
            color="#ffba08"
          />

          {/* Complexity */}
          <FadeInText
            show={stage >= 5}
            text="Time Complexity: O(n) → proportional to array size"
            position={[0, -2.6, 0]}
            fontSize={0.34}
            color="#facc15"
          />

          {/* Example */}
          <FadeInText
            show={stage >= 6}
            text={`arr = [10, 20, 30, 40]\nSearch 30 → Found at index 2 after checking 3 elements`}
            position={[0, -3.4, 0]}
            fontSize={0.28}
            color="#9be7a2"
          />

          {/* Ground plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
};

/* ---------- Box component ---------- */
const Box = ({ index, value, position = [0, 0, 0], highlight, found }) => {
  const meshRef = useRef();
  const size = [1.6, 1.2, 1];

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = new THREE.Color("#60a5fa");
    const targetColor = found
      ? new THREE.Color("#4ade80")
      : highlight
      ? new THREE.Color("#f87171")
      : baseColor;
    const targetEmissive = highlight || found ? 0.9 : 0;

    mat.color.lerp(targetColor, 0.12);
    mat.emissive = mat.emissive || new THREE.Color(0x000000);
    mat.emissive.lerp(new THREE.Color(targetColor), 0.12);
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity || 0,
      targetEmissive,
      0.12
    );
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={"#60a5fa"}
          emissive={"#000000"}
          emissiveIntensity={0}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>

      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        anchorX="right"
        anchorY="middle"
        color="yellow"
      >
        [{index}]
      </Text>
    </group>
  );
};

/* ---------- Fade-in Text ---------- */
const FadeInText = ({
  show = false,
  text = "",
  position = [0, 0, 0],
  fontSize = 0.5,
  color = "white",
}) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.85);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.03, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.06, 0);
      scale.current = Math.max(scale.current - 0.04, 0.85);
    }
    if (ref.current && ref.current.material) {
      ref.current.material.transparent = true;
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
};

export default ARPage3;
