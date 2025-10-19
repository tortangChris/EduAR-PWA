import React, { useState, useMemo, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3";

const ARPage3 = ({ data = [5, 10, 15, 20, 25], spacing = 2.0 }) => {
  const [searching, setSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [foundIndex, setFoundIndex] = useState(null);
  const [statusText, setStatusText] = useState("");
  const [infoText, setInfoText] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const boxRefs = useRef([]);

  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

  const handleSearch = (index) => {
    if (searching) return;
    setSearching(true);
    setHighlightIndex(null);
    setFoundIndex(null);
    setStatusText("");
    setInfoText("");
    setShowCode(false);

    let i = 0;
    setStatusText("🔍 Starting linear search...");

    const interval = setInterval(() => {
      setHighlightIndex(i);
      setStatusText(`Checking index ${i} → value ${data[i]}`);

      if (i === index) {
        clearInterval(interval);
        setTimeout(() => {
          setFoundIndex(i);
          play();
          setStatusText(`✅ Found value ${data[i]} at index ${i}`);
          setInfoText(`Value ${data[i]} located after ${i + 1} comparisons`);
          setPseudoCode([
            "📘 Pseudo Code Example:",
            "",
            "for i = 0 to n-1:",
            "   if array[i] == key:",
            "       return i",
            "",
            `// Found at index ${i}`,
          ]);
          setShowCode(true);
          setSearching(false);
        }, 900);
      } else {
        i++;
        if (i >= data.length) {
          clearInterval(interval);
          setTimeout(() => {
            setStatusText("❌ Value not found in array");
            setInfoText("Search completed — no match found.");
            setPseudoCode([
              "📘 Pseudo Code Example:",
              "",
              "for i = 0 to n-1:",
              "   if array[i] == key:",
              "       return i",
              "",
              "return -1  // not found",
            ]);
            setShowCode(true);
            setSearching(false);
          }, 800);
        }
      }
    }, 900);
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas
        camera={{ position: [0, 4, 10], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            try {
              const arButton = ARButton.createButton(gl, {
                requiredFeatures: ["hit-test"],
              });
              arButton.style.position = "absolute";
              arButton.style.top = "8px";
              arButton.style.left = "8px";
              arButton.style.zIndex = 999;
              document.body.appendChild(arButton);
            } catch (e) {
              console.warn("ARButton create failed", e);
            }
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />

        {/* Title */}
        <FadeInText
          show={true}
          text="Search Operation (Linear Search)"
          position={[0, 3, -4]}
          fontSize={0.55}
          color="white"
        />

        {/* Instruction */}
        <FadeInText
          show={!searching && !foundIndex && !infoText}
          text="Tap any box to start searching..."
          position={[0, 2.4, -4]}
          fontSize={0.3}
          color="#ffd166"
        />

        {/* Status */}
        <FadeInText
          show={!!statusText}
          text={statusText}
          position={[0, 2, -4]}
          fontSize={0.32}
          color="#ffd166"
        />

        {/* Boxes */}
        <group position={[0, 0, -4]}>
          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              highlight={highlightIndex === i}
              found={foundIndex === i}
              disabled={searching}
              onClick={() => handleSearch(i)}
              ref={(r) => addBoxRef(r)}
            />
          ))}
        </group>

        {/* Info text & pseudo code */}
        {showCode && (
          <>
            <FadeInText
              show={true}
              text={infoText}
              position={[5.2, 1.9, -4]}
              fontSize={0.35}
              color="#9be7a2"
              anchorX="left"
            />

            {pseudoCode.map((line, i) => (
              <FadeInText
                key={i}
                show={true}
                text={line}
                position={[5.4, 1.1 - i * 0.35, -4]}
                fontSize={0.28}
                color={line.startsWith("//") ? "#9be7a2" : "#ffeb99"}
                anchorX="left"
              />
            ))}
          </>
        )}

        <ARInteractionManager boxRefs={boxRefs} onBoxSelect={handleSearch} />
      </Canvas>
    </div>
  );
};

/* ---------- AR Interaction Manager ---------- */
const ARInteractionManager = ({ boxRefs, onBoxSelect }) => {
  const { gl } = useThree();
  const xrRef = gl.xr;

  useEffect(() => {
    if (!navigator.xr) return;

    const onSessionStart = () => {
      const session = xrRef.getSession();
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
          .map((g) => (g ? g.children : []))
          .flat();

        const intersects = raycaster.intersectObjects(candidates, true);

        if (intersects && intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && !hit.userData?.boxIndex && hit.parent) {
            hit = hit.parent;
          }
          const idx = hit?.userData?.boxIndex;
          if (idx !== undefined && idx !== null) {
            onBoxSelect(idx);
          }
        }
      };

      session.addEventListener("select", onSelect);
      const onEnd = () => session.removeEventListener("select", onSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, xrRef, boxRefs, onBoxSelect]);

  return null;
};

/* ---------- Box Component ---------- */
const Box = forwardRef(
  (
    { index, value, position = [0, 0, 0], highlight, found, disabled, onClick },
    ref
  ) => {
    const meshRef = useRef();
    const groupRef = useRef();
    const size = [1.6, 1.2, 1];

    useEffect(() => {
      if (groupRef.current) {
        groupRef.current.userData = { boxIndex: index };
      }
    }, [index]);

    useFrame(() => {
      if (!meshRef.current) return;
      const mat = meshRef.current.material;
      const baseColor = new THREE.Color(
        index % 2 === 0 ? "#60a5fa" : "#34d399"
      );
      const targetColor = found
        ? new THREE.Color("#fbbf24")
        : highlight
        ? new THREE.Color("#f87171")
        : baseColor;
      const targetEmissive = highlight || found ? 0.9 : 0;
      mat.color.lerp(targetColor, 0.12);
      mat.emissive = mat.emissive || new THREE.Color(0x000000);
      mat.emissive.lerp(targetColor, 0.12);
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity || 0,
        targetEmissive,
        0.12
      );
    });

    return (
      <group
        position={position}
        ref={(g) => {
          groupRef.current = g;
          if (typeof ref === "function") ref(g);
          else if (ref) ref.current = g;
        }}
      >
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          position={[0, size[1] / 2, 0]}
          onClick={!disabled ? onClick : undefined}
        >
          <boxGeometry args={size} />
          <meshStandardMaterial color={"#60a5fa"} emissive={"#000"} />
        </mesh>

        <Text
          position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]}
          fontSize={0.35}
          anchorX="center"
          anchorY="middle"
        >
          {String(value)}
        </Text>

        <Text
          position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
          fontSize={0.22}
          anchorX="center"
          anchorY="middle"
          color="#e0e0e0"
        >
          [{index}]
        </Text>
      </group>
    );
  }
);

/* ---------- Fade-in Text ---------- */
const FadeInText = ({
  show = false,
  text = "",
  position = [0, 0, 0],
  fontSize = 0.5,
  color = "white",
  anchorX = "center",
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
      anchorX={anchorX}
      anchorY="middle"
    >
      {text}
    </Text>
  );
};

export default ARPage3;
