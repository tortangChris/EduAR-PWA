import React, {
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * VisualPage1 (AR-enabled)
 *
 * - Keep your existing structure (Boxes, labels, definitions).
 * - Adds ARRoot and ARInteractor so tapping in AR raycasts into the scene and triggers your handlers.
 *
 * Usage: keep your existing Start AR control (which should call renderer.xr.setSession(...) or navigator.xr.requestSession).
 * This component will automatically pick up an active XR session from the renderer.
 */

const VisualPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null); // for value click

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handleIndexClick = useCallback(() => {
    setShowPanel((prev) => !prev);
    setPage(0);
  }, []);

  const handleNextClick = useCallback(() => {
    if (page < 2) setPage((p) => p + 1);
    else setShowPanel(false);
  }, [page]);

  const handleBoxClick = useCallback((i) => {
    setSelectedBox((prev) => (prev === i ? null : i));
  }, []);

  return (
    <div className="w-full h-[300px]">
      {/* Canvas with XR enabled */}
      <Canvas
        gl={{ antialias: true, xrCompatible: true }}
        camera={{ position: [0, 4, 12], fov: 50 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Put all content under ARRoot so we can position it relative to camera in AR */}
        <ARRoot distance={1.0}>
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
        </ARRoot>

        {/* Orbit controls still available for non-XR / inline view */}
        <OrbitControls makeDefault />

        {/* AR Interactor listens to XR session select events and does raycast -> triggers clicks */}
        <ARInteractor
          onMeshClick={(mesh, uv, point) => {
            // find which Box was clicked using userData index (set below on meshes)
            const idx = mesh.userData?.boxIndex;
            const type = mesh.userData?.clickType; // "value" or "index"
            if (idx !== undefined) {
              if (type === "value") {
                handleBoxClick(idx);
              } else if (type === "index") {
                handleIndexClick();
              }
            }
          }}
        />
      </Canvas>
    </div>
  );
};

/* ----------------------------
   AR Root: positions the whole group
   in front of the camera by `distance` meters when in XR immersive session.
   ---------------------------- */
const ARRoot = ({ children, distance = 1.0 }) => {
  const ref = useRef();
  const { camera, gl } = useThree();
  const xr = gl.xr;

  useFrame(() => {
    const session = xr.getSession && xr.getSession();
    if (session) {
      // If in XR, position the root group so it's always `distance` meters in front of the camera.
      // Compute camera world position + forward * distance
      const camWorldPos = new THREE.Vector3();
      camera.getWorldPosition(camWorldPos);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
        camera.quaternion
      );
      const targetPos = camWorldPos.clone().add(dir.multiplyScalar(distance));
      if (ref.current) {
        ref.current.position.lerp(targetPos, 0.4); // smooth follow
        // optional: face the camera (so text faces user)
        ref.current.quaternion.slerp(camera.quaternion, 0.4);
      }
    } else {
      // Not in XR: keep the root at origin (or you can keep existing transforms)
      if (ref.current) {
        // you can keep manual position for inline view; do nothing here
      }
    }
  });

  return <group ref={ref}>{children}</group>;
};

/* ----------------------------
   ARInteractor: listens to XR select events and raycasts into the scene.
   It supports:
   - screen taps (inputSource.targetRayMode === 'screen')
   - controller select (ray from inputSource pose)
   When it intersects a mesh, it calls onMeshClick(mesh, uv, point)
   ---------------------------- */
const ARInteractor = ({ onMeshClick }) => {
  const { gl, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const tmpVec = useRef(new THREE.Vector3());
  const tmpQuat = useRef(new THREE.Quaternion());

  useEffect(() => {
    const session = gl.xr.getSession && gl.xr.getSession();
    if (!session) return;

    // We'll need a reference space. Use 'local' (or viewer) if available.
    let xrRefSpace = null;
    let mounted = true;

    const onSelect = (event) => {
      // event: XRInputSourceEvent
      try {
        const frame = event.frame;
        const inputSource = event.inputSource;
        const xrSession = event.target || gl.xr.getSession();

        // Choose reference space: prefer local
        if (!xrRefSpace) {
          xrSession
            .requestReferenceSpace("local")
            .then((rs) => {
              xrRefSpace = rs;
            })
            .catch(() => {
              xrSession
                .requestReferenceSpace("viewer")
                .then((rs) => {
                  xrRefSpace = rs;
                })
                .catch(() => {
                  xrRefSpace = null;
                });
            });
        }

        // If targetRayMode is 'screen' we attempt to get hit by casting a ray from the viewer through -Z
        // Otherwise use the inputSource.targetRaySpace pose to create ray.
        if (inputSource.targetRayMode === "screen") {
          // For screen taps, approximate a ray from camera forward
          const cam = gl.xr.getCamera ? gl.xr.getCamera() : gl.camera;
          const origin = new THREE.Vector3();
          cam.getWorldPosition(origin);
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
            cam.quaternion
          );
          raycaster.current.set(origin, dir);
        } else {
          // Controller / pointing device: use targetRaySpace pose
          const pose = frame.getPose(
            inputSource.targetRaySpace,
            xrRefSpace ||
              frame.session.viewerSpace ||
              frame.session.referenceSpace
          );
          if (!pose) {
            // fallback: use camera forward
            const cam = gl.xr.getCamera ? gl.xr.getCamera() : gl.camera;
            const origin = new THREE.Vector3();
            cam.getWorldPosition(origin);
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(
              cam.quaternion
            );
            raycaster.current.set(origin, dir);
          } else {
            const pos = pose.transform.position;
            const ori = pose.transform.orientation;
            const origin = new THREE.Vector3(pos.x, pos.y, pos.z);
            const quat = new THREE.Quaternion(ori.x, ori.y, ori.z, ori.w);
            const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
            raycaster.current.set(origin, dir);
          }
        }

        // Raycast against scene children
        const intersects = raycaster.current.intersectObjects(
          scene.children,
          true
        );
        if (intersects && intersects.length > 0) {
          const hit = intersects[0];
          // call callback with mesh (the object with userData), uv, and point
          if (onMeshClick) onMeshClick(hit.object, hit.uv, hit.point);
        }
      } catch (err) {
        console.warn("ARInteractor select handling error:", err);
      }
    };

    session.addEventListener("select", onSelect);

    return () => {
      mounted = false;
      if (session && onSelect) {
        session.removeEventListener("select", onSelect);
      }
    };
  }, [gl, scene, onMeshClick]);

  return null;
};

/* === Background (simple box) === */
const ArrayBackground = ({ data, spacing }) => {
  const width = Math.max(6, (data.length - 1) * spacing + 3);
  const height = 2.4;
  const boxGeo = useMemo(
    () => new THREE.BoxGeometry(width, height, 0.06),
    [width, height]
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(boxGeo), [boxGeo]);

  return (
    <group position={[0, height / 2 - 0.2, -0.6]}>
      <mesh geometry={boxGeo}>
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial attach="material" color="#94a3b8" />
      </lineSegments>
    </group>
  );
};

/* === Fade-in Text === */
const FadeInText = ({ show, text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.6);

  useFrame(() => {
    if (!ref.current) return;
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

/* === Box === */
const Box = ({
  index,
  value,
  position,
  selected,
  onValueClick,
  onIndexClick,
}) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399";

  // We add userData to meshes so ARInteractor can know which box/index was clicked.
  return (
    <group position={position}>
      {/* Main Box */}
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onClick={onValueClick}
        userData={{ boxIndex: index, clickType: "value" }}
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
        // userData on the Text's mesh is not directly available; but drei's Text creates a group with children.
        // To help ARInteractor find the index when it intersects the Text mesh, we set userData on the parent group below as well:
      >
        [{index}]
      </Text>

      {/* invisible helper mesh for index clickable (so AR raycast hits it reliably) */}
      <mesh
        position={[0, -0.3, size[2] / 2 + 0.011]}
        userData={{ boxIndex: index, clickType: "index" }}
        onClick={onIndexClick}
      >
        <planeGeometry args={[1.4, 0.4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

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

/* === Definition Panel === */
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

export default VisualPage1;
