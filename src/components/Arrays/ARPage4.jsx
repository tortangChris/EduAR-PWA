// ARPage4.jsx
import React, { useState, useMemo, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3"; // Make sure this exists

const MAX_INDEX = 6; // Limit: up to 6 indexes only

const ARPage4 = ({ spacing = 2.2 }) => {
  const [array, setArray] = useState([5, 10, 15, "Append"]);
  const [inserting, setInserting] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [infoText, setInfoText] = useState("Tap 'Append' box to add new value");
  const [pseudoCode, setPseudoCode] = useState([]);
  const [play] = useSound(dingSfx, { volume: 0.5 });

  // Compute box positions
  const positions = useMemo(() => {
    const mid = (array.length - 1) / 2;
    return array.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [array, spacing]);

  // Box refs for AR raycasting
  const boxRefs = useRef([]);
  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

  // Insert handler
  const handleInsert = (insertIndex) => {
    if (inserting || array.length - 1 >= MAX_INDEX) return;
    setInserting(true);
    setHighlightIndex(insertIndex);
    setInfoText("🧩 Appending new value at the end...");

    setTimeout(() => {
      const newValue = Math.floor(Math.random() * 90) + 10;
      const newArray = [...array];
      newArray.splice(insertIndex, 0, newValue);

      if (newArray.length - 1 >= MAX_INDEX) {
        newArray.pop(); // remove Append
        setInfoText("⚠️ Limit reached (6 indexes)");
      } else {
        setInfoText(`✅ Inserted value ${newValue} at index ${insertIndex}`);
      }

      setArray(newArray);
      play();
      setHighlightIndex(null);
      setInserting(false);

      // Pseudo-code
      const cleanArray = newArray.filter((v) => v !== "Append");
      setPseudoCode([
        "📘 Pseudo Code Example:",
        "",
        `array = [${cleanArray.join(", ")}]`,
        `index = ${insertIndex}`,
        "",
        `value = array[index]`,
        `print('Accessed Value:', value)`,
        "",
        `// Result: ${newValue}`,
      ]);
    }, 1000);
  };

  // Auto-start WebXR AR session
  const startAR = (gl) => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          navigator.xr
            .requestSession("immersive-ar", {
              requiredFeatures: ["hit-test", "local-floor"],
            })
            .then((session) => gl.xr.setSession(session))
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
        camera={{ position: [0, 4, 10], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          startAR(gl);
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={0.8} />

        {/* Title */}
        <FadeText text="Insertion Operation" position={[0, 2.8, -2]} fontSize={0.55} color="white" />

        {/* Step Info */}
        <FadeText text={infoText} position={[0, 2, -2]} fontSize={0.3} color="#ffd166" />

        {/* Boxes */}
        <group position={[0, 0, -6]}>
          {array.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              highlight={highlightIndex === i}
              isInsert={value === "Append"}
              disabled={inserting}
              onClick={() => handleInsert(i)}
              ref={(r) => addBoxRef(r)}
            />
          ))}

          {/* Pseudo-code display */}
          {pseudoCode.length > 0 && (
            <group position={[0, -1, 0]}>
              {pseudoCode.map((line, i) => (
                <FadeText
                  key={i}
                  text={line}
                  position={[0, -0.35 * i, 0]}
                  fontSize={0.28}
                  color={
                    line.startsWith("//")
                      ? "#8ef5b8"
                      : line.startsWith("array") || line.startsWith("index") || line.startsWith("value") || line.startsWith("print")
                      ? "#ffeb99"
                      : "#9be7a2"
                  }
                />
              ))}
            </group>
          )}
        </group>

        {/* AR Interaction Manager */}
        <ARInteractionManager boxRefs={boxRefs} handleInsert={handleInsert} />
      </Canvas>
    </div>
  );
};

// AR Interaction Manager
const ARInteractionManager = ({ boxRefs, handleInsert }) => {
  const { gl } = useThree();

  useEffect(() => {
    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      const onSelect = () => {
        const xrCamera = gl.xr.getCamera();
        const raycaster = new THREE.Raycaster();
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        raycaster.set(origin, dir);

        const candidates = (boxRefs.current || []).map((g) => (g ? g.children : [])).flat();
        const intersects = raycaster.intersectObjects(candidates, true);
        if (intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && hit.userData?.boxIndex === undefined && hit.parent) hit = hit.parent;
          const idx = hit?.userData?.boxIndex;
          if (idx !== undefined) handleInsert(idx);
        }
      };

      session.addEventListener("select", onSelect);
      session.addEventListener("end", () => session.removeEventListener("select", onSelect));
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, boxRefs, handleInsert]);

  return null;
};

// Box Component
const Box = forwardRef(({ index, value, position, highlight, isInsert, disabled, onClick }, ref) => {
  const meshRef = useRef();
  const size = [1.6, 1.2, 1];

  useEffect(() => {
    if (meshRef.current && meshRef.current.parent) {
      meshRef.current.parent.userData = { boxIndex: index };
    }
  }, [index]);

  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const baseColor = isInsert ? "#fbbf24" : index % 2 === 0 ? "#60a5fa" : "#34d399";
    const targetColor = highlight ? new THREE.Color("#f87171") : new THREE.Color(baseColor);
    const targetEmissive = highlight || isInsert ? 0.7 : 0;
    mat.color.lerp(targetColor, 0.12);
    mat.emissive = mat.emissive || new THREE.Color(0x000000);
    mat.emissive.lerp(targetColor, 0.1);
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity || 0, targetEmissive, 0.12);
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={!disabled && isInsert ? onClick : undefined}
      style={{ cursor: isInsert && !disabled ? "pointer" : "default" }}
    >
      <mesh ref={meshRef} castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial color={"#60a5fa"} emissive={"#000"} />
      </mesh>

      <Text position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]} fontSize={0.35} anchorX="center" anchorY="middle">
        {String(value)}
      </Text>

      {value !== "Append" && (
        <Text position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]} fontSize={0.22} anchorX="center" anchorY="middle" color="#e0e0e0">
          [{index}]
        </Text>
      )}
    </group>
  );
});

// FadeText Component
const FadeText = ({ text = "", position = [0, 0, 0], fontSize = 0.5, color = "white" }) => {
  const [opacity, setOpacity] = useState(0);
  useEffect(() => {
    let frame;
    let start;
    const duration = 800;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setOpacity(progress);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <Text position={position} fontSize={fontSize} color={color} anchorX="center" anchorY="middle" fillOpacity={opacity}>
      {text}
    </Text>
  );
};

export default ARPage4;
