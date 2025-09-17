// ARPage2_Access.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";

const ARPage2_Access = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  accessValue = 30,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [fadeValues, setFadeValues] = useState({});
  const [operationText, setOperationText] = useState("");

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // loop access operation
  useEffect(() => {
    let targetIndex = data.findIndex((v) => v === accessValue);
    if (targetIndex === -1) return;

    let loopTimeout;

    const runAccess = () => {
      setOperationText(`Access v=${accessValue}`);
      setActiveIndex(null);

      loopTimeout = setTimeout(() => {
        setActiveIndex(targetIndex);

        let start;
        const duration = 2000;
        const animate = (timestamp) => {
          if (!start) start = timestamp;
          const elapsed = timestamp - start;
          const progress = Math.min(elapsed / duration, 1);
          const fade = 1 - progress;

          setFadeValues({ [targetIndex]: fade });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            loopTimeout = setTimeout(() => {
              setFadeValues({});
              setActiveIndex(null);
              runAccess(); // loop again
            }, 3000);
          }
        };

        requestAnimationFrame(animate);
      }, 3000);
    };

    runAccess();
    return () => clearTimeout(loopTimeout);
  }, [data, accessValue]);

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 50 }}
        gl={{ alpha: true }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .isSessionSupported("immersive-ar")
              .then((supported) => {
                if (supported) {
                  navigator.xr
                    .requestSession("immersive-ar", {
                      requiredFeatures: ["local-floor"],
                    })
                    .then((session) => {
                      gl.xr.setSession(session);
                    })
                    .catch((err) =>
                      console.error("❌ Failed to start AR session:", err)
                    );
                } else {
                  console.warn("⚠️ AR NOT SUPPORTED on this device");
                }
              });
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* Operation text */}
        {operationText && (
          <Text
            position={[0, 3, 0]}
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
            color="white"
          >
            {operationText}
          </Text>
        )}

        {/* Boxes */}
        {data.map((value, i) => (
          <Box
            key={i}
            index={i}
            value={value}
            position={positions[i]}
            fade={fadeValues[i] || 0}
          />
        ))}

        {/* Shadow plane */}
        <mesh rotation-x={-Math.PI / 2} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <shadowMaterial opacity={0.3} />
        </mesh>
      </Canvas>
    </div>
  );
};

const Box = ({ index, value, position = [0, 0, 0], fade }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive="#facc15"
          emissiveIntensity={fade}
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

export default ARPage2_Access;
