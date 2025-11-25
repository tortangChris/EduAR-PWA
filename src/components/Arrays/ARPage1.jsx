import React, { useMemo, useState, useRef, useEffect, forwardRef } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls, Text, useCursor } from "@react-three/drei";
import * as THREE from "three";

const VisualPageAR = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [showPanel, setShowPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedBox, setSelectedBox] = useState(null);
  const [orbitEnabled, setOrbitEnabled] = useState(true);
  const boxRefs = useRef([]);

  // --- Helper to collect box refs ---
  const addBoxRef = (r) => {
    if (r && !boxRefs.current.includes(r)) boxRefs.current.push(r);
  };

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handleClick = (i) => {
    setSelectedBox(i);
    setShowPanel(true);
    setPage(0);
  };

  const handleNextClick = () => {
    if (page < 2) setPage(page + 1);
    else setShowPanel(false);
  };

  // === Automatically start AR session ===
  const startAR = (gl) => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        if (supported) {
          navigator.xr
            .requestSession("immersive-ar", {
              requiredFeatures: ["hit-test", "local-floor"],
            })
            .then((session) => {
              gl.xr.setSession(session);
            })
            .catch((err) => console.error("AR session failed:", err));
        } else {
          console.warn("AR not supported on this device.");
        }
      });
    }
  };

  return (
    <div className="w-full h-[300px]" style={{ touchAction: 'none' }}>
      <Canvas
        camera={{ position: [0, 4, 25], fov: 50 }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          // Optionally start AR
          // startAR(gl);
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
            <DraggableBox
              key={i}
              index={i}
              value={value}
              initialPosition={positions[i]}
              selected={selectedBox === i}
              onClick={() => handleClick(i)}
              ref={(r) => addBoxRef(r)}
              setOrbitEnabled={setOrbitEnabled}
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
        <OrbitControls makeDefault enabled={orbitEnabled} />
      </Canvas>
      
      {/* AR Button - Optional */}
      <button
        onClick={() => {
          const canvas = document.querySelector('canvas');
          if (canvas && canvas.__r3f) {
            startAR(canvas.__r3f.gl);
          }
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        Start AR
      </button>
    </div>
  );
};

// --- AR Interaction Manager ---
const ARInteractionManager = ({ boxRefs, setSelectedBox }) => {
  const { gl } = useThree();

  useEffect(() => {
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

        const candidates = (boxRefs.current || [])
          .map((group) => (group ? group.children : []))
          .flat();

        const intersects = raycaster.intersectObjects(candidates, true);
        if (intersects.length > 0) {
          let hit = intersects[0].object;
          while (hit && hit.userData?.boxIndex === undefined && hit.parent) {
            hit = hit.parent;
          }
          const idx = hit?.userData?.boxIndex;
          if (idx !== undefined) setSelectedBox(idx);
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

// === Fixed Draggable Box Component ===
const DraggableBox = forwardRef(({ 
  index, 
  value, 
  initialPosition, 
  selected, 
  onClick,
  setOrbitEnabled
}, ref) => {
  const size = [1.6, 1.2, 1];
  const color = selected ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399";
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [clickTimeout, setClickTimeout] = useState(null);
  
  const { camera, gl, scene } = useThree();
  
  useCursor(hovered && !isDragging, 'grab');
  useCursor(isDragging, 'grabbing');

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.userData = { boxIndex: index };
      groupRef.current.position.set(...initialPosition);
    }
  }, [index, initialPosition]);

  useEffect(() => {
    if (!groupRef.current) return;

    let isDraggingLocal = false;
    let plane = new THREE.Plane();
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let intersection = new THREE.Vector3();
    let offset = new THREE.Vector3();
    let startPos = new THREE.Vector3();

    const handlePointerDown = (e) => {
      if (e.target !== gl.domElement) return;
      
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(groupRef.current, true);
      
      if (intersects.length > 0) {
        e.stopPropagation();
        isDraggingLocal = true;
        setIsDragging(true);
        setOrbitEnabled(false);
        
        // Create a plane perpendicular to the camera
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        plane.setFromNormalAndCoplanarPoint(
          cameraDirection.negate(),
          intersects[0].point
        );
        
        // Calculate offset
        if (raycaster.ray.intersectPlane(plane, intersection)) {
          offset.copy(intersection).sub(groupRef.current.position);
        }
        
        startPos.copy(groupRef.current.position);
        
        // Set up click detection
        const timeout = setTimeout(() => {
          setClickTimeout(null);
        }, 200);
        setClickTimeout(timeout);
      }
    };

    const handlePointerMove = (e) => {
      if (!isDraggingLocal) return;
      
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        groupRef.current.position.copy(intersection.sub(offset));
      }
    };

    const handlePointerUp = (e) => {
      if (isDraggingLocal) {
        const endPos = new THREE.Vector3();
        endPos.copy(groupRef.current.position);
        
        // Check if it was a click (not moved much)
        const distance = startPos.distanceTo(endPos);
        if (distance < 0.1 && clickTimeout) {
          onClick();
        }
        
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          setClickTimeout(null);
        }
        
        isDraggingLocal = false;
        setIsDragging(false);
        setOrbitEnabled(true);
      }
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [camera, gl, scene, onClick, setOrbitEnabled, clickTimeout]);

  // Floating animation when dragging
  useFrame((state) => {
    if (isDragging && groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = Math.sin(time * 2) * 0.1;
    } else if (groupRef.current) {
      groupRef.current.rotation.y *= 0.9;
    }
  });

  return (
    <group
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
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={selected || hovered || isDragging ? "#fbbf24" : "#000000"}
          emissiveIntensity={isDragging ? 0.6 : selected ? 0.4 : hovered ? 0.2 : 0}
          transparent
          opacity={isDragging ? 0.85 : 1}
        />
      </mesh>

      <FadeInText
        show={true}
        text={String(value)}
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.4}
        color="white"
      />

      <mesh 
        position={[0, -0.3, size[2] / 2 + 0.01]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[0.9, 0.4]} />
        <meshBasicMaterial transparent opacity={0} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.3}
          color="yellow"
          anchorX="center"
          anchorY="middle"
        >
          [{index}]
        </Text>
      </mesh>

      {selected && !isDragging && (
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
      
      {isDragging && (
        <>
          <Text
            position={[0, -1, 0]}
            fontSize={0.25}
            color="#38bdf8"
            anchorX="center"
            anchorY="middle"
          >
            Dragging...
          </Text>
          {/* Drop zone indicator */}
          <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
});

// === Definition Panel ===
const DefinitionPanel = ({ page, data, index, position, onNextClick }) => {
  let content = "";

  if (page === 0) {
    content = [
      `📘 Index ${index}`,
      "",
      `• Value: ${data[index]}`,
      "• Remember: indexes start from 0.",
    ].join("\n");
  } else if (page === 1) {
    content = [
      "📗 Array Property:",
      "",
      "• Access time: O(1)",
      "• Stored in contiguous memory.",
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