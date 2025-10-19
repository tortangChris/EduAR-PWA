// VisualPage1WithAR.jsx
import React, { useMemo, useState, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { XR, ARButton, Interactive } from "@react-three/xr";

/**
 * VisualPage1WithAR
 * - Wraps Canvas children with XR (from @react-three/xr).
 * - Shows an AR button. When AR session active, controller taps call Interactive onSelect.
 */
const VisualPage1WithAR = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null); // for value click
  const [isARSession, setIsARSession] = useState(false);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handleIndexClick = () => {
    setShowPanel((prev) => !prev);
    setPage(0);
  };

  const handleNextClick = () => {
    if (page < 2) setPage(page + 1);
    else setShowPanel(false);
  };

  const handleBoxClick = (i) => {
    setSelectedBox((prev) => (prev === i ? null : i));
  };

  return (
    <div className="w-full h-[400px]">
      {/* ARButton renders native AR entry UI for supported browsers/devices */}
      <ARButton
        style={{ position: "absolute", zIndex: 10, right: 12, top: 12 }}
        onSessionStart={() => setIsARSession(true)}
        onSessionEnd={() => setIsARSession(false)}
      />
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        {/* XR wrapper enables WebXR mode for children */}
        <XR>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {/* Header */}
          <FadeInText
            show={true}
            text={"Array Data Structure"}
            position={[0, 3, 0]}
            fontSize={0.7}
            color="white"
          />

          <ArrayBackground data={data} spacing={spacing} />

          {/* Boxes */}
          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              selected={selectedBox === i}
              onValueClick={() => handleBoxClick(i)}
              onIndexClick={handleIndexClick}
              isARSession={isARSession}
              // let Box call back to parent selection state
              onSelectInAR={() => {
                // when selected in AR, set selected state here
                handleBoxClick(i);
              }}
            />
          ))}

          {/* Side Panel */}
          {showPanel && (
            <DefinitionPanel
              page={page}
              data={data}
              position={[8, 1, 0]}
              onNextClick={handleNextClick}
            />
          )}

          <OrbitControls makeDefault />
        </XR>
      </Canvas>
    </div>
  );
};

// === Background ===
const ArrayBackground = ({ data, spacing }) => {
  const width = Math.max(6, (data.length - 1) * spacing + 3);
  const height = 2.4;
  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(width, height, 0.06),
    [width, height]
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  return (
    <group position={[0, height / 2 - 0.3, -0.4]}>
      <mesh geometry={boxGeo}>
        <meshStandardMaterial color={"#0f172a"} />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial linewidth={1} color={"#334155"} />
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
      material-transparent
      maxWidth={8}
      textAlign="center"
    >
      {text}
    </Text>
  );
};

// === Box ===
/**
 * Box behavior:
 * - Normal (non-AR): mesh onClick toggles selection (existing behavior)
 * - AR session: wrap interactable meshes in <Interactive onSelect={..} /> so controller tap triggers selection.
 * - When selected in AR, we reposition the mesh to be in front of camera at a fixed distance.
 */
const Box = ({
  index,
  value,
  position,
  selected,
  onValueClick,
  onIndexClick,
  isARSession,
  onSelectInAR,
}) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399";

  return (
    <group position={position}>
      {/* For AR interactions we use <Interactive> (from @react-three/xr)
          For non-AR, the mesh's onClick still works. */}
      <InteractiveWrapper isAR={isARSession} onSelect={() => onSelectInAR()}>
        <mesh
          castShadow
          receiveShadow
          position={[0, size[1] / 2, 0]}
          onClick={onValueClick}
        >
          <boxGeometry args={size} />
          <meshStandardMaterial
            color={color}
            emissive={selected ? "#fbbf24" : "#000000"}
            emissiveIntensity={selected ? 0.4 : 0}
          />
        </mesh>
      </InteractiveWrapper>

      {/* Value label */}
      <FadeInText
        show={true}
        text={String(value)}
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
      />

      {/* Index clickable */}
      <Text
        position={[0, -0.3, size[2] / 2 + 0.01]}
        fontSize={0.3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        onClick={onIndexClick}
      >
        [{index}]
      </Text>

      {/* 3D label when selected */}
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
};

/**
 * InteractiveWrapper
 * - If AR session is active we wrap children with <Interactive onSelect={...} />
 * - On select, we compute a position in front of the camera and move the wrapped mesh group there.
 */
const InteractiveWrapper = ({ children, isAR, onSelect }) => {
  const groupRef = useRef();
  const { camera, scene } = useThree();

  // distance in meters in front of camera where to place object in AR
  const PLACE_DISTANCE = 1.0;

  // helper: compute point in front of camera
  const computeFrontPosition = (distance = PLACE_DISTANCE) => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir); // normalized
    const pos = new THREE.Vector3();
    camera.getWorldPosition(pos);
    // move forward and a little down so it's roughly centered in view
    return pos.add(dir.multiplyScalar(distance));
  };

  // Called when controller select (AR) taps the interactive object
  const handleARSelect = (e) => {
    // Position the groupRef in front of the camera
    if (groupRef.current) {
      const newPos = computeFrontPosition(PLACE_DISTANCE);
      groupRef.current.parent.worldToLocal(newPos); // convert to local coordinates
      groupRef.current.position.copy(newPos);
      // face the camera (optional)
      groupRef.current.lookAt(camera.position);
    }
    if (onSelect) onSelect();
  };

  if (!isAR) {
    // Not AR -> just render children normally inside a group for consistent ref
    return <group ref={groupRef}>{children}</group>;
  }

  // AR: use <Interactive> from @react-three/xr to capture select events from controllers / taps
  return (
    <Interactive onSelect={handleARSelect}>
      <group ref={groupRef}>{children}</group>
    </Interactive>
  );
};

// === Definition Panel ===
const DefinitionPanel = ({ page, data, position, onNextClick }) => {
  let content = "";

  if (page === 0) {
    content = [
      "📘 Understanding Index in Arrays:",
      "",
      "• Index is the position assigned to each element.",
      "• Starts at 0, so first element → index 0.",
    ].join("\n");
  } else if (page === 1) {
    content = [
      "📗 In Data Structures & Algorithms:",
      "",
      "• Indexing gives O(1) access time.",
      "• Arrays are stored in contiguous memory.",
    ].join("\n");
  } else if (page === 2) {
    content = [
      "📊 Index Summary:",
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

export default VisualPage1WithAR;
