import React, { useState, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3";

const ARPage4 = ({
  data = [10, 20, 30, 40],
  spacing = 2.0,
  insertValue = 99,
  insertIndex = 2,
}) => {
  const boxesRef = useRef([]);
  const animRef = useRef({ rafId: null, cancelled: false });
  const [boxes, setBoxes] = useState([]);
  const [statusText, setStatusText] = useState("");
  const [stage, setStage] = useState(0);
  const [placed, setPlaced] = useState(true);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  const posForIndex = (index, count) => (index - (count - 1) / 2) * spacing;

  const createBoxes = (arr, newVal = null, newY = 0, highlightIdx = null) => {
    const n = arr.length;
    const count = newVal !== null ? n + 1 : n;
    const mid = (count - 1) / 2;
    const result = [];
    for (let i = 0; i < count; i++) {
      if (i < n) {
        result.push({
          id: `b${i}`,
          value: arr[i],
          slot: i,
          x: (i - mid) * spacing,
          y: 0,
          isNew: false,
          highlight: i === highlightIdx,
        });
      } else if (newVal !== null) {
        result.push({
          id: "new",
          value: newVal,
          slot: i,
          x: (i - mid) * spacing,
          y: newY,
          isNew: true,
          highlight: true,
        });
      }
    }
    return result;
  };

  const animateDropAndShift = async () => {
    const n = data.length;
    const count = n + 1;

    // Drop new box
    await new Promise((resolve) => {
      function frame() {
        if (animRef.current.cancelled) return resolve();
        let done = true;
        setBoxes((prev) =>
          prev.map((bx) => {
            if (bx.isNew) {
              const targetY = 0;
              const dy = targetY - bx.y;
              const newY = Math.abs(dy) < 0.01 ? targetY : bx.y + dy * 0.12;
              if (Math.abs(newY - targetY) > 0.01) done = false;
              return { ...bx, y: newY };
            }
            return bx;
          })
        );
        if (done) return resolve();
        animRef.current.rafId = requestAnimationFrame(frame);
      }
      animRef.current.rafId = requestAnimationFrame(frame);
    });

    // Shift elements right
    for (let i = n - 1; i >= insertIndex; i--) {
      if (animRef.current.cancelled) break;
      const targetA = posForIndex(i + 1, count);
      const targetB = posForIndex(i, count);
      const aId = boxesRef.current.find((b) => b.slot === i && !b.isNew)?.id;
      const bId = boxesRef.current.find((b) => b.isNew)?.id;

      setStatusText(`Shifting element at index ${i} to the right`);

      await new Promise((resolve) => {
        function frame() {
          if (animRef.current.cancelled) return resolve();
          let done = true;
          setBoxes((prev) =>
            prev.map((bx) => {
              if (bx.id === aId) {
                const dx = targetA - bx.x;
                const newX = Math.abs(dx) < 0.01 ? targetA : bx.x + dx * 0.15;
                if (Math.abs(newX - targetA) > 0.01) done = false;
                return { ...bx, x: newX, highlight: true };
              }
              if (bx.id === bId) {
                const dx = targetB - bx.x;
                const newX = Math.abs(dx) < 0.01 ? targetB : bx.x + dx * 0.15;
                if (Math.abs(newX - targetB) > 0.01) done = false;
                return { ...bx, x: newX };
              }
              return bx;
            })
          );
          if (done) {
            setBoxes((prev) =>
              prev.map((bx) => {
                if (bx.id === aId)
                  return { ...bx, slot: i + 1, x: targetA, highlight: false };
                if (bx.id === bId)
                  return { ...bx, slot: i, x: targetB, highlight: false };
                return bx;
              })
            );
            return resolve();
          }
          animRef.current.rafId = requestAnimationFrame(frame);
        }
        animRef.current.rafId = requestAnimationFrame(frame);
      });
    }
  };

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
        time: 2,
        action: () => {
          setStage(2);
          setStatusText(
            "Insertion = adding a new element into the array. Elements to the right shift."
          );
          play();
        },
      },
      {
        time: 5,
        action: () => {
          const initial = createBoxes(data);
          setBoxes(initial);
          boxesRef.current = initial;
          setStage(3);
          setStatusText("Initial array: [10,20,30,40]");
          play();
        },
      },
      {
        time: 8,
        action: () => {
          const appended = createBoxes([...data, insertValue]);
          setBoxes(appended);
          boxesRef.current = appended;
          setStage(4);
          setStatusText("Append 99 at the end: [10,20,30,40,99]");
          play();
        },
      },
      {
        time: 11,
        action: async () => {
          const prep = createBoxes(data, insertValue, 3.5);
          setBoxes(prep);
          boxesRef.current = prep;
          setStage(5);
          setStatusText("Dropping 99 into index 2");
          play();
          await animateDropAndShift();
        },
      },
      {
        time: 14,
        action: () => {
          const finalArr = data.slice();
          finalArr.splice(insertIndex, 0, insertValue);
          const finalBoxes = createBoxes(finalArr);
          setBoxes(finalBoxes);
          boxesRef.current = finalBoxes;
          setStage(6);
          setStatusText("Final array: [10,20,99,30,40]");
          play();
        },
      },
      {
        time: 17,
        action: () => {
          setStage(7);
          setStatusText("Time Complexity: O(n)");
          play();
        },
      },
      {
        time: 20,
        action: () => {
          setStage(8);
          setStatusText(
            "Example:\narr = [10,20,30,40]\nInsert 99 at index 2 → [10,20,99,30,40]"
          );
          play();
        },
      },
    ];

    let timers = timeline.map((t) => setTimeout(t.action, t.time * 1000));

    const loop = setInterval(() => {
      setStage(0);
      setStatusText("");
      setBoxes([]);
      animRef.current.cancelled = true;
      timers.forEach(clearTimeout);
      timers = timeline.map((t) => setTimeout(t.action, t.time * 1000));
      animRef.current.cancelled = false;
    }, 25000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
      animRef.current.cancelled = true;
      if (animRef.current.rafId) cancelAnimationFrame(animRef.current.rafId);
    };
  }, [placed]);

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
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
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Fixed AR group */}
        <group position={[0, 1, -2]} scale={[0.1, 0.1, 0.1]}>
          <FadeInText
            show={!!statusText}
            text={statusText}
            position={[0, 3.5, 0]}
            fontSize={0.45}
            color="#ffd166"
          />
          {boxes.map((b) => (
            <Box
              key={b.id}
              x={b.x}
              y={b.y}
              value={b.value}
              displayIndex={b.slot}
              highlight={b.highlight}
            />
          ))}

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

const Box = ({
  x = 0,
  y = 0,
  value = null,
  displayIndex = 0,
  highlight = false,
}) => {
  const meshRef = useRef();
  const size = [1.6, 1.2, 1];

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = new THREE.Color("#60a5fa");
    const targetColor = highlight ? new THREE.Color("#4ade80") : baseColor;
    mat.color.lerp(targetColor, 0.12);
  });

  return (
    <group position={[x, y, 0]}>
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} />
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
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >{`[${displayIndex}]`}</Text>
    </group>
  );
};

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

export default ARPage4;
