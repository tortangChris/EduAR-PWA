import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const ARPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [operationText, setOperationText] = useState("");

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 1.6, 4], fov: 50 }}
        gl={{ alpha: true }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"], // ✅ no hit-test
              })
              .then((session) => {
                gl.xr.setSession(session);
              })
              .catch((err) => {
                console.error("❌ Failed to start AR session:", err);
              });
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* Operation text always above objects */}
        {operationText && (
          <Text
            position={[0, 2, -3]} // ✅ fixed in front of user
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
            color="white"
          >
            {operationText}
          </Text>
        )}

        {/* Boxes */}
        <group position={[0, 0, -3]} scale={[0.2, 0.2, 0.2]}>
          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              isActive={activeIndex === i}
            />
          ))}

          {/* Shadow plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.1, 0]}>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>

        {/* Tap detection controls */}
        <TapControls
          setActiveIndex={setActiveIndex}
          setOperationText={setOperationText}
        />
      </Canvas>
    </div>
  );
};

const Box = ({ index, value, position = [0, 0, 0], isActive }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        userData={{ index, value }} // ✅ para ma-detect ng raycaster
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive={isActive ? "#facc15" : "black"}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </mesh>

      {/* Value text */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* Index text */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        fontSize={0.2}
        anchorX="center"
        anchorY="middle"
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

const TapControls = ({ setActiveIndex, setOperationText }) => {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    const onSelect = () => {
      const viewerPose = gl.xr.getCamera(camera);
      if (!viewerPose) return;

      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
        viewerPose.quaternion
      );

      raycaster.current.set(origin, direction);

      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );
      if (intersects.length > 0) {
        const first = intersects[0].object;
        const { index, value } = first.userData;

        if (index !== undefined) {
          setActiveIndex(index);
          setOperationText(`Selected v=${value} at [${index}]`);
        }
      }
    };

    session.addEventListener("select", onSelect);
    return () => session.removeEventListener("select", onSelect);
  }, [gl, camera, scene, setActiveIndex, setOperationText]);

  return null;
};

export default ARPage2;
