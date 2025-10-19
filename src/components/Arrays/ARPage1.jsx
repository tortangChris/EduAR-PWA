import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";

const VisualPageAR = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null); // for value click

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // refs to boxes for raycasting in AR
  const boxRefs = useRef([]);
  boxRefs.current = [];

  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

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
        camera={{ position: [0, 4, 25], fov: 50 }}
        onCreated={({ gl, scene, camera }) => {
          // enable xr on renderer
          gl.xr.enabled = true;
          // attach AR button
          if (navigator.xr) {
            try {
              const arButton = ARButton.createButton(gl, {
                requiredFeatures: ["hit-test", "anchors"],
              });
              // add near top-left, avoid overlap with header:
              arButton.style.position = "absolute";
              arButton.style.top = "8px";
              arButton.style.left = "8px";
              arButton.style.zIndex = 999;
              document.body.appendChild(arButton);
            } catch (e) {
              // if ARButton not supported it will throw; ignore gracefully
              console.warn("ARButton create failed", e);
            }
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

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
            ref={(r) => addBoxRef(r)}
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

        <ARInteractionManager
          boxRefs={boxRefs}
          setSelectedBox={setSelectedBox}
        />

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

// --- AR Interaction Manager ---
// Handles select events in XR session: raycast from camera center,
// select box if hit, else place anchor object 1m in front of camera.
const ARInteractionManager = ({ boxRefs, setSelectedBox }) => {
  const { gl, scene } = useThree();
  const xrRef = gl.xr;
  const spawnedObjectRef = useRef(null); // a visual marker/anchored object we can move to front

  // create a simple anchor visual (small sphere) so user sees where object is placed
  useEffect(() => {
    const geo = new THREE.SphereGeometry(0.08, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: "#ff7f50",
      emissive: "#ff7f50",
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.name = "ar-anchor-visual";
    scene.add(mesh);
    spawnedObjectRef.current = mesh;

    return () => {
      scene.remove(mesh);
      geo.dispose();
      mat.dispose();
    };
  }, [scene]);

  useEffect(() => {
    if (!navigator.xr) return;
    const onSessionStart = () => {
      const session = xrRef.getSession();
      if (!session) return;

      // listen to select events - fired on tap / controller click
      const onSelect = (event) => {
        // we'll raycast from center of camera to detect hits with boxRefs
        // get XR camera
        const xrCamera = gl.xr.getCamera();

        // create a ray from camera center (NDC 0,0)
        const raycaster = new THREE.Raycaster();
        // For XR camera, use its children (left/right) - use the "camera" returned by r3f:
        // easiest is to use xrCamera.cameras[0] (works for mono)
        const cam = xrCamera.cameras ? xrCamera.cameras[0] : xrCamera;
        // direction vector (camera forward)
        const dir = new THREE.Vector3(0, 0, -1)
          .applyQuaternion(cam.quaternion)
          .normalize();
        const origin = cam.getWorldPosition(new THREE.Vector3());
        raycaster.set(origin, dir);

        // collect candidate meshes from refs
        const candidates = (boxRefs.current || [])
          .map((group) => {
            // group might be a <group> containing meshes; find mesh children
            return group ? group.children.filter((c) => c.isMesh) : [];
          })
          .flat();

        const intersects = raycaster.intersectObjects(candidates, true);

        if (intersects && intersects.length > 0) {
          // find which box index was clicked (walk up parent until group with name/index)
          let hit = intersects[0].object;
          // traverse upward to find the parent group that we attached as Box group
          while (hit && !hit.userData?.boxIndex && hit.parent) {
            hit = hit.parent;
          }
          const idx = hit && hit.userData ? hit.userData.boxIndex : null;
          if (idx !== null && idx !== undefined) {
            setSelectedBox((prev) => (prev === idx ? null : idx));
            return;
          }
        }

        // If no hit -> place anchor visual 1 meter in front of camera
        const distance = 1.0; // 1 meter
        const placementPos = origin.clone().add(dir.multiplyScalar(distance));
        if (spawnedObjectRef.current) {
          spawnedObjectRef.current.position.copy(placementPos);
          spawnedObjectRef.current.visible = true;
          // optionally orient to face camera
          spawnedObjectRef.current.lookAt(origin);
        }
      };

      session.addEventListener("select", onSelect);

      // cleanup on end
      const onEnd = () => {
        session.removeEventListener("select", onSelect);
      };
      session.addEventListener("end", onEnd);
    };

    // watch session start
    gl.xr.addEventListener("sessionstart", onSessionStart);

    return () => {
      gl.xr.removeEventListener("sessionstart", onSessionStart);
    };
  }, [gl, xrRef, boxRefs, setSelectedBox]);

  return null;
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
const Box = forwardRef(
  ({ index, value, position, selected, onValueClick, onIndexClick }, ref) => {
    const size = [1.6, 1.2, 1];
    const color = selected
      ? "#facc15"
      : index % 2 === 0
      ? "#60a5fa"
      : "#34d399";

    // groupRef for raycasting upward traversal
    const groupRef = useRef();
    useEffect(() => {
      if (groupRef.current) {
        // store index so AR raycast can find which box was hit
        groupRef.current.userData = { boxIndex: index };
      }
    }, [index]);

    return (
      <group
        position={position}
        ref={(g) => {
          groupRef.current = g;
          if (typeof ref === "function") ref(g);
          else if (ref) ref.current = g;
        }}
      >
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

export default VisualPageAR;
