import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import { XR, Interactive } from "@react-three/xr";

const ARPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [operationText, setOperationText] = useState("");

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
          gl.xr.enabled = true; // ✅ enable XR only
        }}
      >
        <XR>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

          {/* Text shown when selecting */}
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

          <group position={[0, 0, -3]} scale={[0.2, 0.2, 0.2]}>
            {data.map((value, i) => (
              <Interactive
                key={i}
                onSelect={() => {
                  setActiveIndex(i);
                  setOperationText(`Access v=${value}`);
                }}
              >
                <Box
                  index={i}
                  value={value}
                  position={positions[i]}
                  isActive={activeIndex === i}
                />
              </Interactive>
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

const Box = ({ index, value, position = [0, 0, 0], isActive }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position} scale={isActive ? 1.2 : 1}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={isActive ? "#f87171" : index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive={isActive ? "#facc15" : "#000000"}
          emissiveIntensity={isActive ? 0.8 : 0}
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
