// ARPage1.jsx
import React, { useRef, useState, useMemo } from "react";
import { ARCanvas, useHitTest, useXR, Interactive } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const ARPage1 = () => {
  const [placements, setPlacements] = useState([]);

  const handlePlace = (position) => {
    // Limit to one array visualization (replace instead of stacking)
    setPlacements([position]);
  };

  return (
    <div className="w-full h-screen">
      <ARCanvas sessionInit={{ requiredFeatures: ["hit-test"] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 5, 2]} intensity={1} />

        <XRHitPlace onSelect={handlePlace} />

        {placements.map((pos, i) => (
          <ArrayVisualization key={i} position={pos} />
        ))}
      </ARCanvas>
    </div>
  );
};

// === Hit Test (Tap placement indicator) ===
const XRHitPlace = ({ onSelect }) => {
  const reticleRef = useRef();
  const hitMatrix = useRef(new THREE.Matrix4());

  useHitTest((hitMatrixLocal) => {
    hitMatrix.current = hitMatrixLocal;
    if (reticleRef.current) {
      reticleRef.current.visible = true;
      const pos = new THREE.Vector3().setFromMatrixPosition(hitMatrix.current);
      reticleRef.current.position.copy(pos);
    }
  });

  const handleSelect = () => {
    if (reticleRef.current?.visible) {
      const pos = reticleRef.current.position.clone();
      onSelect(pos);
    }
  };

  return (
    <Interactive onSelect={handleSelect}>
      <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color="#ffd700" />
      </mesh>
    </Interactive>
  );
};

// === Array Visualization ===
const ArrayVisualization = ({ position }) => {
  const data = [10, 20, 30, 40];
  const spacing = 0.35; // increased spacing for AR clarity
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <group position={[position.x, position.y + 0.05, position.z]}>
      {/* Title Label */}
      <Text
        position={[0, 0.25, 0]}
        fontSize={0.1}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Array Data Structure
      </Text>

      {data.map((value, i) => (
        <Box key={i} position={positions[i]} value={value} index={i} />
      ))}
    </group>
  );
};

// === Box ===
const Box = ({ value, index, position }) => {
  const color = index % 2 === 0 ? "#60a5fa" : "#34d399";

  return (
    <group position={position}>
      {/* Box */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.22, 0.22, 0.22]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Value Label */}
      <Text
        position={[0, 0.25, 0.001]}
        fontSize={0.09}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>

      {/* Index Label */}
      <Text
        position={[0, -0.17, 0.001]}
        fontSize={0.07}
        color="#fde047"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>
    </group>
  );
};

export default ARPage1;
