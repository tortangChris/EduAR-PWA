import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

/**
 * VisualPage1 - main component
 */
const ARPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null); // index of selected box

  // refs for boxes so we can reposition them in AR
  const boxRefs = useRef([]);

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
    // Toggle selection
    setSelectedBox((prev) => (prev === i ? null : i));
  };

  return (
    <div className="w-full h-[300px]">
      <Canvas
        camera={{ position: [0, 4, 12], fov: 50 }}
        onCreated={({ gl }) => {
          // enable XR on the WebGL renderer so ARButton can use it
          gl.xr.enabled = true;
        }}
      >
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
            ref={(el) => (boxRefs.current[i] = el)}
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

        {/* AR controls component - handles ARButton and select events */}
        <ARControls
          boxRefs={boxRefs}
          selectedBoxIndexRef={{ current: selectedBox }}
          // default distance in meters to place object in front of camera
          placeDistance={1.2}
        />
      </Canvas>
    </div>
  );
};

// === ArrayBackground (kept minimal - you can expand) ===
const ArrayBackground = ({ data, spacing }) => {
  const width = Math.max(6, (data.length - 1) * spacing + 3);
  const height = 2.4;
  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(width, height, 0.06),
    [width, height]
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  return (
    <group position={[0, 0, -0.1]}>
      <mesh geometry={boxGeo} position={[0, height / 2 - 0.2, 0]}>
        <meshStandardMaterial color="#0b1221" />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial linewidth={1} />
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
      // drei Text uses material internally; this is best-effort
      if (ref.current.material.opacity !== undefined)
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

// === Box (forwardRef so parent can move it) ===
const Box = forwardRef(
  ({ index, value, position, selected, onValueClick, onIndexClick }, ref) => {
    const size = [1.6, 1.2, 1];
    const color = selected
      ? "#facc15"
      : index % 2 === 0
      ? "#60a5fa"
      : "#34d399";

    return (
      <group position={position} ref={ref}>
        {/* Main Box */}
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
  }
);

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

/**
 * ARControls
 * - Adds the three.js ARButton to the DOM
 * - Listens for XR `select` event and places the currently-selected box
 *   in front of the camera at a fixed distance.
 *
 * Props:
 * - boxRefs: ref object that holds array of group refs for each Box
 * - selectedBoxIndexRef: an object with { current } that contains the currently selected box index
 * - placeDistance: distance in meters (default 1.2)
 */
const ARControls = ({ boxRefs, selectedBoxIndexRef, placeDistance = 1.2 }) => {
  const { gl, camera } = useThree();

  useEffect(() => {
    if (!gl || !gl.domElement) return;

    // create AR button and append to body
    const arButton = ARButton.createButton(gl, {
      requiredFeatures: ["hit-test"],
    });
    arButton.classList.add("my-ar-button");
    document.body.appendChild(arButton);

    // Helper: place a box index in front of camera
    const placeBoxInFront = (index) => {
      if (index == null) return;
      const group = boxRefs.current[index];
      if (!group) return;

      // compute camera world position & forward direction
      const camPos = new THREE.Vector3();
      camera.getWorldPosition(camPos);
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);

      // target = camPos + dir * distance
      const target = camPos.add(dir.multiplyScalar(placeDistance));

      group.position.set(target.x, target.y, target.z);
    };

    // When a session starts, add a 'select' listener
    const onSessionStart = (session) => {
      // add select listener to session inputs
      session.addEventListener("select", (ev) => {
        // place selected box in front of camera when user taps/selects in AR
        const idx = selectedBoxIndexRef.current;
        if (idx != null) {
          placeBoxInFront(idx);
        } else {
          // Optional: if no box selected, put the first box in front
          if (boxRefs.current && boxRefs.current.length > 0) {
            placeBoxInFront(0);
          }
        }
      });
    };

    // There is no uniform event to detect session start from ARButton, but three's renderer
    // emits 'sessionstart' / 'sessionend' on gl.xr (in three r125+). We'll attach there if available.
    const xr = gl.xr;
    const onXRSessionStart = (ev) => onSessionStart(ev.session || ev);
    xr.addEventListener &&
      xr.addEventListener("sessionstart", onXRSessionStart);

    // Cleanup
    return () => {
      try {
        arButton.remove();
      } catch (e) {}
      xr.removeEventListener &&
        xr.removeEventListener("sessionstart", onXRSessionStart);
    };
  }, [gl, camera, boxRefs, selectedBoxIndexRef, placeDistance]);

  return null;
};

export default ARPage1;
