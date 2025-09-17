import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";

const ARPage3 = ({
  data = [10, 20, 30, 40, 50],
  spacing = 2.0,
  target = 40,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [operationText, setOperationText] = useState("Starting AR...");
  const [placed] = useState(true); // ✅ always placed

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    if (!placed) return;

    let steps = [
      { text: "🔍 Searching for v=40...", index: null, delay: 2000 },
      { text: "Checking index 0...", index: 0, delay: 2000 },
      { text: "Checking index 1...", index: 1, delay: 2000 },
      { text: "Checking index 2...", index: 2, delay: 2000 },
      { text: "✅ Found 40 at index 3", index: 3, delay: 2000 },
      { text: "Restarting search...", index: null, delay: 3000 },
    ];

    let currentStep = 0;
    let loop;

    const runStep = () => {
      const step = steps[currentStep];
      setOperationText(step.text);
      setActiveIndex(step.index);

      loop = setTimeout(() => {
        currentStep++;
        if (currentStep >= steps.length) {
          currentStep = 0; // restart
        }
        runStep();
      }, step.delay);
    };

    runStep();

    return () => clearTimeout(loop);
  }, [placed]);

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
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"], // ✅ no hit-test
              })
              .then((session) => {
                gl.xr.setSession(session);
              })
              .catch((err) => console.error("❌ AR session failed:", err));
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        {/* ✅ Billboard Group */}
        <BillboardGroup>
          {/* Operation text above */}
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
              highlight={activeIndex === i}
            />
          ))}

          {/* Ground plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </BillboardGroup>
      </Canvas>
    </div>
  );
};

function BillboardGroup({ children }) {
  const groupRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;

    // Position group 2 units in front of camera
    const offset = camera
      .getWorldDirection(new THREE.Vector3())
      .multiplyScalar(2);
    groupRef.current.position.copy(camera.position).add(offset);

    // Rotate to face camera
    groupRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef} scale={[0.1, 0.1, 0.1]}>
      {children}
    </group>
  );
}

const Box = ({ index, value, position = [0, 0, 0], highlight }) => {
  const size = [1.6, 1.2, 1];
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={
            highlight ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399"
          }
          emissive={highlight ? "#facc15" : "#000"}
          emissiveIntensity={highlight ? 1 : 0}
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

export default ARPage3;
