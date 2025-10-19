import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const ARPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [selectedBox, setSelectedBox] = useState(null);
  const boxRefs = useRef([]);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handleClick = (i) => {
    setSelectedBox((prev) => (prev === i ? null : i));
  };

  const generateCode = (index, value) => {
    return [
      "📘 Pseudo Code Example:",
      "",
      "array = [10, 20, 30, 40, 50]",
      `index = ${index}`,
      "",
      "value = array[index]",
      "print('Accessed Value:', value)",
      "",
      `// Result: ${value}`,
    ].join("\n");
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas
        camera={{ position: [0, 4, 15], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            try {
              const arButton = ARButton.createButton(gl, {
                requiredFeatures: ["hit-test", "anchors"],
              });
              arButton.style.position = "absolute";
              arButton.style.top = "8px";
              arButton.style.left = "8px";
              arButton.style.zIndex = 999;
              document.body.appendChild(arButton);
            } catch (e) {
              console.warn("ARButton creation failed", e);
            }
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <group position={[0, 0, -8]}>
          <FadeText
            text="Array Access Operation (O(1))"
            position={[0, 4, 0]}
            fontSize={0.6}
            color="#facc15"
          />
          <FadeText
            text="Tap a box to view its value and pseudo code"
            position={[0, 3.2, 0]}
            fontSize={0.35}
            color="white"
          />

          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              selected={selectedBox === i}
              onClick={() => handleClick(i)}
              ref={(r) => (boxRefs.current[i] = r)}
            />
          ))}

          {selectedBox !== null && (
            <CodePanel
              code={generateCode(selectedBox, data[selectedBox])}
              position={[8, 1, 0]}
            />
          )}
        </group>

        <ARInteractionManager
          boxRefs={boxRefs}
          setSelectedBox={setSelectedBox}
        />
      </Canvas>
    </div>
  );
};

// === AR Interaction Manager ===
const ARInteractionManager = ({ boxRefs, setSelectedBox }) => {
  const { gl } = useThree();

  useEffect(() => {
    if (!navigator.xr) return;

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

        const objects = boxRefs.current
          .filter(Boolean)
          .flatMap((g) => g.children || []);

        const intersects = raycaster.intersectObjects(objects, true);
        if (intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && !hit.userData?.boxIndex && hit.parent) {
            hit = hit.parent;
          }
          if (hit.userData?.boxIndex !== undefined) {
            setSelectedBox((prev) =>
              prev === hit.userData.boxIndex ? null : hit.userData.boxIndex
            );
          }
        }
      };

      session.addEventListener("select", onSelect);
      const onEnd = () => session.removeEventListener("select", onSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, boxRefs, setSelectedBox]);

  return null;
};

// === Box (with invisible collider mesh) ===
const Box = forwardRef(({ index, value, position, selected, onClick }, ref) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#f87171" : index % 2 === 0 ? "#60a5fa" : "#34d399";
  const groupRef = useRef();

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
    }
  }, [index]);

  return (
    <group
      position={position}
      ref={(g) => {
        groupRef.current = g;
        if (ref) ref.current = g;
      }}
    >
      {/* Main box */}
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onClick={onClick}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000000"}
          emissiveIntensity={selected ? 0.6 : 0}
        />
      </mesh>

      {/* Clickable invisible box (for raycast) */}
      <mesh
        position={[0, size[1] / 2, 0]}
        userData={{ boxIndex: index }}
        onClick={onClick}
      >
        <boxGeometry args={size} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Texts */}
      <Text
        position={[0, size[1] / 2 + 0.1, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.02]}
        fontSize={0.25}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {selected && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.32}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Value {value} at index {index}
        </Text>
      )}
    </group>
  );
});

const CodePanel = ({ code, position }) => (
  <group>
    <FadeText text={code} position={position} fontSize={0.3} color="#c7d2fe" />
  </group>
);

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
