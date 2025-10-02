import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import useSound from "use-sound";
import * as THREE from "three";

// tiny base64 beep sound
const beep = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAA..."; // shortened

const ARPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [stage, setStage] = useState(0);
  const [placed, setPlaced] = useState(true); // always placed
  const [play] = useSound(beep, { volume: 0.5 });

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // Timeline (looping every 18s)
  useEffect(() => {
    if (!placed) return;

    const timeline = [
      { time: 0, action: () => setStage(1) },
      { time: 3, action: () => setStage(2) },
      { time: 6, action: () => setStage(3) },
      {
        time: 9,
        action: () => {
          setStage(4);
          play();
        },
      },
      { time: 12, action: () => setStage(5) },
      { time: 15, action: () => setStage(6) },
    ];

    let timers = timeline.map((t) => setTimeout(t.action, t.time * 1000));

    const loop = setInterval(() => {
      setStage(0);
      timers = timeline.map((t) => setTimeout(t.action, t.time * 1000));
    }, 18000);

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
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* Fixed AR group */}
        <group position={[0, 1, -2]} scale={[0.1, 0.1, 0.1]}>
          {/* Title */}
          {stage >= 1 && (
            <FadeText text="Access Operation (O(1))" position={[0, 3.5, 0]} />
          )}

          {/* Definition */}
          {stage >= 2 && (
            <FadeText
              text="Access = retrieving an element using its index"
              position={[0, 2.8, 0]}
              fontSize={0.35}
            />
          )}

          {/* Boxes */}
          {stage >= 3 &&
            data.map((value, i) => (
              <Box
                key={i}
                index={i}
                value={value}
                position={positions[i]}
                highlight={stage >= 4 && i === 2}
              />
            ))}

          {/* Complexity */}
          {stage >= 5 && (
            <FadeText
              text="Time Complexity: O(1) → constant time"
              position={[0, -2.8, 0]}
              fontSize={0.35}
              color="#facc15"
            />
          )}

          {/* Example code */}
          {stage >= 6 && (
            <FadeText
              text={`arr = [10, 20, 30, 40]\narr[2] = 30   # Access index 2`}
              position={[0, -3.5, 0]}
              fontSize={0.28}
              color="lightgreen"
            />
          )}

          {/* Ground */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>
      </Canvas>
    </div>
  );
};

// Box with highlight
const Box = ({ index, value, position = [0, 0, 0], highlight }) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={
            highlight ? "#f87171" : index % 2 === 0 ? "#60a5fa" : "#34d399"
          }
          emissive={highlight ? "#facc15" : "#000000"}
          emissiveIntensity={highlight ? 1.5 : 0}
        />
      </mesh>

      {/* Value */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {String(value)}
      </Text>

      {/* Index aligned like labels */}
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

// Fade-in text
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
    >
      {text}
    </Text>
  );
};

export default ARPage2;
