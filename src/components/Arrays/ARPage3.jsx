import React, { useMemo, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

const VisualPage3_Hardcoded = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  target = 40,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [fadeValues, setFadeValues] = useState({});
  const [operationText, setOperationText] = useState("Searching...");

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    let timeouts = [];

    const runSearch = () => {
      setOperationText(`🔍 Searching for ${target}...`);
      setActiveIndex(null);
      setFadeValues({});

      data.forEach((val, i) => {
        const delay = i * 4000; // 2s highlight + 2s fade per index

        // highlight
        timeouts.push(
          setTimeout(() => {
            setActiveIndex(i);
            setFadeValues({ [i]: 1 });
            setOperationText(`Checking index ${i}... v=${val}`);
          }, delay)
        );

        // fade out
        timeouts.push(
          setTimeout(() => {
            setFadeValues({ [i]: 0 });
          }, delay + 2000)
        );

        // if found
        if (val === target) {
          timeouts.push(
            setTimeout(() => {
              setOperationText(`✅ Found ${target} at index ${i}`);
              setActiveIndex(null);
              setFadeValues({});
            }, delay + 2500)
          );

          // restart loop
          timeouts.push(
            setTimeout(() => {
              runSearch();
            }, delay + 5000)
          );
        }
      });
    };

    runSearch();

    return () => timeouts.forEach((id) => clearTimeout(id));
  }, [data, target]);

  return (
    <div className="w-full h-[400px] bg-gray-50 flex flex-col items-center justify-center">
      {/* Status text */}
      <div className="mb-4 text-lg font-mono">{operationText}</div>

      {/* 3D Scene */}
      <div className="w-full h-[70%]">
        <Canvas camera={{ position: [0, 4, 12], fov: 50 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 10, 5]} intensity={0.8} />

          {data.map((value, i) => (
            <Box
              key={i}
              index={i}
              value={value}
              position={positions[i]}
              fade={fadeValues[i] || 0}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>
      </div>
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

export default VisualPage3_Hardcoded;
