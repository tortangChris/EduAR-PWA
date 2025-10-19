import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const VisualPage2AR = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [selectedBox, setSelectedBox] = useState(null);
  const [anchors, setAnchors] = useState([]); // 🆕 store placed anchors
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
        camera={{ position: [0, 4, 25], fov: 50 }}
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
              console.warn("ARButton create failed", e);
            }
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <group position={[0, 0, -8]}>
          <FadeInText
            show={true}
            text={"Array Access Operation (O(1))"}
            position={[0, 3.5, 0]}
            fontSize={0.7}
            color="#facc15"
          />

          <FadeInText
            show={true}
            text={"Click or tap a box to view its value and pseudo code"}
            position={[0, 2.6, 0]}
            fontSize={0.35}
            color="white"
          />

          <ArrayBackground data={data} spacing={spacing} />

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

        {/* 🆕 Render all placed anchors */}
        {anchors.map((pos, i) => (
          <mesh key={i} position={pos}>
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshStandardMaterial color="#fbbf24" />
          </mesh>
        ))}

        <ARInteractionManager
          boxRefs={boxRefs}
          setSelectedBox={setSelectedBox}
          setAnchors={setAnchors} // 🆕 pass setter for anchors
        />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// === AR Interaction Manager ===
const ARInteractionManager = ({ boxRefs, setSelectedBox, setAnchors }) => {
  const { gl } = useThree();

  useEffect(() => {
    if (!navigator.xr) return;

    const onSessionStart = () => {
      const session = gl.xr.getSession();
      if (!session) return;

      // 🆕 Hit test source for AR plane detection
      let hitTestSource = null;
      let viewerSpace = null;

      session.requestReferenceSpace("viewer").then((refSpace) => {
        viewerSpace = refSpace;
        session.requestHitTestSource({ space: viewerSpace }).then((source) => {
          hitTestSource = source;
        });
      });

      const onSelect = (event) => {
        const frame = event.frame;
        const xrCamera = gl.xr.getCamera();

        // --- Raycast for 3D boxes ---
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
            return; // stop if a box was clicked
          }
        }

        // --- 🆕 If no box clicked, place anchor on AR surface ---
        const refSpace = gl.xr.getReferenceSpace();
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hitPose = hitTestResults[0].getPose(refSpace);
          const pos = [
            hitPose.transform.position.x,
            hitPose.transform.position.y,
            hitPose.transform.position.z,
          ];

          // add a marker cube to anchors list
          setAnchors((prev) => [...prev, pos]);
        }
      };

      session.addEventListener("select", onSelect);
      const onEnd = () => session.removeEventListener("select", onSelect);
      session.addEventListener("end", onEnd);
    };

    gl.xr.addEventListener("sessionstart", onSessionStart);
    return () => gl.xr.removeEventListener("sessionstart", onSessionStart);
  }, [gl, boxRefs, setSelectedBox, setAnchors]);

  return null;
};

// === Array Background ===
const ArrayBackground = ({ data, spacing }) => {
  const width = Math.max(6, (data.length - 1) * spacing + 3);
  const height = 2.4;
  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(width, height, 0.06),
    [width, height]
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  return (
    <group position={[0, 0.9, -1]}>
      <mesh geometry={boxGeo}>
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial />
      </lineSegments>
    </group>
  );
};

// === Fade-in Text ===
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.06, 1);
      scale.current = Math.min(scale.current + 0.06, 1);
    } else {
      opacity.current = Math.max(opacity.current - 0.06, 0);
      scale.current = 0.6;
    }

    if (ref.current?.material) {
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
      material-transparent
      maxWidth={10}
      textAlign="left"
    >
      {text}
    </Text>
  );
};

// === Box Component ===
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
          emissiveIntensity={selected ? 0.5 : 0}
        />
      </mesh>

      <FadeInText
        show={true}
        text={String(value)}
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
      />

      <Text
        position={[0, -0.4, size[2] / 2 + 0.05]}
        fontSize={0.3}
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

// === Code Panel ===
const CodePanel = ({ code, position }) => (
  <group>
    <FadeInText
      show={true}
      text={code}
      position={position}
      fontSize={0.32}
      color="#c7d2fe"
    />
  </group>
);

export default VisualPage2AR;
