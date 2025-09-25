import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { XR } from "@react-three/xr";

const ARPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [operationText, setOperationText] = useState("");

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  const handleSelect = (index, value) => {
    setActiveIndex(index);
    setOperationText(`Selected v=${value} at [${index}]`);

    // reset after 2s
    setTimeout(() => {
      setActiveIndex(null);
      setOperationText("");
    }, 2000);
  };

  return (
    <div className="w-full h-screen">
      <Canvas
        shadows
        camera={{ position: [0, 2, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"],
              })
              .then((session) => {
                gl.xr.setSession(session);
              })
              .catch((err) => console.error("❌ Failed to start AR:", err));
          }
        }}
      >
        <XR>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} castShadow />

          {/* Operation text */}
          {operationText && (
            <Text
              position={[0, 2, -3]}
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
                onSelect={handleSelect}
              />
            ))}

            {/* Shadow plane */}
            <mesh
              rotation-x={-Math.PI / 2}
              receiveShadow
              position={[0, -0.1, 0]}
            >
              <planeGeometry args={[10, 10]} />
              <shadowMaterial opacity={0.3} />
            </mesh>
          </group>
        </XR>
      </Canvas>
    </div>
  );
};

const Box = ({ index, value, position = [0, 0, 0], isActive, onSelect }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onPointerDown={() => onSelect(index, value)} // ✅ tap works in AR
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive={isActive ? "#facc15" : "black"}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

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

export default ARPage2;
