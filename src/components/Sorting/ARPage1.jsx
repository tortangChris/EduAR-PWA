import React, { useState, useMemo, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

// AR-only page converted from VisualPage1 (3D) to run inside a WebXR AR session
export default function ARPage3({ data = [35, 10, 25, 5, 15], spacing = 2 }) {
  const [sorted, setSorted] = useState(false);
  const [boxes, setBoxes] = useState(data);
  const boxRefs = useRef([]);

  // prepare positions and heights similar to original
  const heights = useMemo(() => {
    const maxVal = Math.max(...boxes);
    return boxes.map((v) => (v / maxVal) * 2 + 0.5); // 0.5 - 2.5
  }, [boxes]);

  const positions = useMemo(() => {
    const mid = (boxes.length - 1) / 2;
    return boxes.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [boxes, spacing]);

  // toggle sorted/reset state
  const handleSortToggle = () => {
    if (!sorted) {
      const sortedData = [...boxes].sort((a, b) => a - b);
      setBoxes(sortedData);
      setSorted(true);
    } else {
      setBoxes(data);
      setSorted(false);
    }
  };

  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

  return (
    <div className="w-full h-[100vh]">
      <Canvas
        camera={{ position: [0, 4, 6], fov: 50 }}
        onCreated={({ gl }) => {
          // enable XR and add ARButton to enter AR-only session
          gl.xr.enabled = true;
          try {
            const arButton = ARButton.createButton(gl, {
              requiredFeatures: ["hit-test"],
              optionalFeatures: ["dom-overlay"],
              domOverlay: { root: document.body },
            });
            arButton.style.position = "absolute";
            arButton.style.top = "12px";
            arButton.style.left = "12px";
            arButton.style.zIndex = 9999;
            document.body.appendChild(arButton);
          } catch (e) {
            console.warn("ARButton creation failed", e);
          }
        }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} />

        {/* Group placed slightly in front of the user in AR */}
        <group position={[0, 0, -1.8]}>
          <FadeText
            text="Introduction to Sorting Algorithms"
            position={[0, 2.4, 0]}
            fontSize={0.45}
            color="#facc15"
          />

          <FadeText
            text={
              sorted
                ? "The array is now sorted in ascending order!"
                : "Tap any box to visualize sorting"
            }
            position={[0, 1.9, 0]}
            fontSize={0.28}
            color="white"
          />

          {/* Boxes */}
          {boxes.map((value, i) => (
            <ARBox
              key={i}
              index={i}
              value={value}
              height={heights[i]}
              position={positions[i]}
              sorted={sorted}
              onSelect={handleSortToggle}
              ref={(r) => addBoxRef(r)}
            />
          ))}

          {/* Code Panel shown when sorted */}
          {sorted && (
            <FadeText
              text={generateCode(boxes)}
              position={[0, -1.45, 0.1]}
              fontSize={0.22}
              color="#c7d2fe"
            />
          )}
        </group>

        {/* AR interaction manager listens for session select events and raycasts against boxes */}
        <ARInteractionManager
          boxRefs={boxRefs}
          onAnyBoxSelected={handleSortToggle}
        />
      </Canvas>
    </div>
  );
}

// ---------- AR Interaction Manager ----------
function ARInteractionManager({ boxRefs, onAnyBoxSelected }) {
  const { gl } = useThree();
  const xr = gl.xr;

  useEffect(() => {
    if (!navigator.xr) return;

    const onSessionStart = () => {
      const session = xr.getSession();
      if (!session) return;

      const onSelect = () => {
        try {
          const xrCamera = gl.xr.getCamera();
          const raycaster = new THREE.Raycaster();

          // use first subcamera if available (VR/AR stereo cameras)
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
            // climb up to parent that has userData.boxIndex
            while (hit && hit.userData?.boxIndex === undefined && hit.parent) {
              hit = hit.parent;
            }
            const idx = hit?.userData?.boxIndex;
            if (idx !== undefined && idx !== null) {
              // notify selection
              onAnyBoxSelected(idx);
            }
          }
        } catch (err) {
          console.warn("AR select handling error", err);
        }
      };

      session.addEventListener("select", onSelect);

      const onEnd = () => session.removeEventListener("select", onSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, xr, boxRefs, onAnyBoxSelected]);

  return null;
}

// ---------- ARBox (forwardRef so parent can collect group refs) ----------
const ARBox = forwardRef(
  ({ index, value, height, position, sorted, onSelect }, ref) => {
    const groupRef = useRef();
    const meshRef = useRef();
    const targetY = height / 2;
    const targetColor = new THREE.Color(sorted ? "#34d399" : "#60a5fa");

    useEffect(() => {
      if (groupRef.current) groupRef.current.userData = { boxIndex: index };
    }, [index]);

    useFrame(() => {
      if (!meshRef.current) return;
      // smooth position (meshRef sits at group's local origin so we lerp group's children)
      meshRef.current.position.x +=
        (position[0] - meshRef.current.position.x) * 0.1;
      meshRef.current.position.y +=
        (targetY - meshRef.current.position.y) * 0.1;
      meshRef.current.material.color.lerp(targetColor, 0.08);
    });

    return (
      <group
        ref={(g) => {
          groupRef.current = g;
          if (typeof ref === "function") ref(g);
          else if (ref) ref.current = g;
        }}
        position={[position[0], 0, position[2] || 0]}
      >
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          onClick={() => onSelect(index)}
        >
          <boxGeometry args={[1.6, height, 1]} />
          <meshStandardMaterial
            color={sorted ? "#34d399" : "#60a5fa"}
            emissive={sorted ? "#fbbf24" : "#000000"}
            emissiveIntensity={sorted ? 0.5 : 0}
          />
        </mesh>

        {/* Value label above the box */}
        <Text
          position={[0, height + 0.28, 0.02]}
          fontSize={0.28}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {String(value)}
        </Text>

        {/* invisible plane behind text to increase hit area in AR (helps raycasting) */}
        <mesh
          position={[0, height - 0.3, 0.51]}
          onClick={() => onSelect(index)}
        >
          <planeGeometry args={[0.9, 0.5]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    );
  }
);

// ---------- FadeText ----------
function FadeText({ text, position, fontSize = 0.4, color = "white" }) {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.8);

  useFrame(() => {
    opacity.current = Math.min(opacity.current + 0.03, 1);
    scale.current = Math.min(scale.current + 0.02, 1);
    if (ref.current && ref.current.material) {
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
      maxWidth={6}
      textAlign="center"
      material-transparent
    >
      {text}
    </Text>
  );
}

// ---------- Utility: generate pseudo code text ----------
function generateCode(array) {
  return [
    "📘 Pseudo Code Example:",
    "",
    `array = [${array.join(", ")}]`,
    "print('Before Sorting:', array)",
    "",
    "sort(array)   // Arrange values in ascending order",
    "print('After Sorting:', array)",
    "",
    `// Result: [${[...array].sort((a, b) => a - b).join(", ")}]`,
  ].join("\n");
}
