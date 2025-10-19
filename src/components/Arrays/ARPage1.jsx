import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const VisualPageAR = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const boxRefs = useRef([]);

  const handleClick = (i) => {
    setSelectedBox(i);
    setShowPanel(true);
    setPage(0);
  };

  const handleNextClick = () => {
    if (page < 2) setPage(page + 1);
    else setShowPanel(false);
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
            text={"Array Data Structure"}
            position={[0, 3, 0]}
            fontSize={0.7}
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

          {showPanel && selectedBox !== null && (
            <DefinitionPanel
              page={page}
              data={data}
              index={selectedBox}
              position={[8, 1, 0]}
              onNextClick={handleNextClick}
            />
          )}
        </group>

        <ARInteractionManager
          boxRefs={boxRefs}
          setSelectedBox={setSelectedBox}
        />
        <OrbitControls makeDefault />
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
            setSelectedBox(hit.userData.boxIndex);
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

// === FadeInText ===
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
      maxWidth={8}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// === Box Component ===
const Box = forwardRef(({ index, value, position, selected, onClick }, ref) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399";
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
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>

      {/* Value label */}
      <FadeInText
        show={true}
        text={String(value)}
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
      />

      {/* Clickable index box */}
      <mesh
        onClick={onClick}
        position={[0, -0.4, size[2] / 2 + 0.01]}
        userData={{ boxIndex: index }}
      >
        <boxGeometry args={[0.9, 0.45, 0.05]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Index text */}
      <Text
        position={[0, -0.4, size[2] / 2 + 0.05]}
        fontSize={0.3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {/* Info above selected box */}
      {selected && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.3}
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

// === Info Panel ===
const DefinitionPanel = ({ page, data, index, position, onNextClick }) => {
  let content = "";

  if (page === 0) {
    content = [
      `📘 Index ${index}`,
      "",
      `• Value: ${data[index]}`,
      "• Index starts from 0.",
    ].join("\n");
  } else if (page === 1) {
    content = [
      "📗 Array Info:",
      "",
      "• Access time: O(1)",
      "• Stored in continuous memory.",
    ].join("\n");
  } else {
    content = [
      "📊 Summary:",
      "",
      ...data.map((v, i) => `• Index ${i} → value ${v}`),
    ].join("\n");
  }

  const nextLabel = page < 2 ? "Next ▶" : "Close ✖";

  return (
    <group>
      <FadeInText
        show={true}
        text={content}
        position={position}
        fontSize={0.32}
        color="#fde68a"
      />
      <Text
        position={[position[0], position[1] - 2.8, position[2]]}
        fontSize={0.45}
        color="#38bdf8"
        anchorX="center"
        anchorY="middle"
        onClick={onNextClick}
      >
        {nextLabel}
      </Text>
    </group>
  );
};

export default VisualPageAR;
