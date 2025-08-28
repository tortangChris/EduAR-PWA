import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage2 = ({ data = [10, 20, 30, 40, 50], spacing = 2.0 }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [fadeValues, setFadeValues] = useState({});

  // positions for boxes along the X axis
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    if (activeIndex !== null) {
      setFadeValues((prev) => ({ ...prev, [activeIndex]: 1 }));

      let start;
      const duration = 2000;

      const animate = (timestamp) => {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const fade = 1 - progress;

        setFadeValues((prev) => ({ ...prev, [activeIndex]: fade }));

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setActiveIndex(null);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [activeIndex]);

  return (
    <div className="w-full h-[300px] bg-gray-50">
      <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Row of boxes */}
        {data.map((value, i) => (
          <Box
            key={i}
            index={i}
            value={value}
            position={positions[i]}
            fade={fadeValues[i] || 0}
            onClick={() => setActiveIndex(i)}
          />
        ))}

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

const Box = ({ index, value, position = [0, 0, 0], fade, onClick }) => {
  // box size
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        onClick={onClick}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive="#facc15"
          emissiveIntensity={fade}
        />
      </mesh>

      {/* Number shown on the front face (3D text) */}
      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.35}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={1}
      >
        {String(value)}
      </Text>

      {/* Index shown below the value on the front face */}
      <Text
        position={[0, size[1] / 2 - 0.35, size[2] / 2 + 0.01]}
        rotation={[0, 0, 0]}
        fontSize={0.2}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        depthOffset={1}
      >
        {`[${index}]`}
      </Text>
    </group>
  );
};

export default VisualPage2;
