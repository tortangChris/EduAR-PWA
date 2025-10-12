// ARPage1.jsx
import React, { useRef, useState, useMemo } from "react";
import { ARCanvas, useHitTest, useXR, Interactive } from "@react-three/xr";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// === Main AR Page ===
const ARPage1 = () => {
  const [placements, setPlacements] = useState([]);

  const handlePlace = (position) => {
    setPlacements((prev) => [...prev, position]);
  };

  return (
    <div className="w-full h-screen">
      <ARCanvas sessionInit={{ requiredFeatures: ["hit-test"] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 2]} intensity={0.8} />

        <XRHitPlace onSelect={handlePlace} />

        {placements.map((pos, i) => (
          <ArrayVisualization key={i} position={pos} />
        ))}
      </ARCanvas>
    </div>
  );
};

// === Hit Test for placing objects ===
const XRHitPlace = ({ onSelect }) => {
  const reticleRef = useRef();
  const hitMatrix = useRef(new THREE.Matrix4());
  const { player } = useXR();

  useHitTest((hitMatrixLocal) => {
    hitMatrix.current = hitMatrixLocal;
    if (reticleRef.current) {
      reticleRef.current.visible = true;
      hitMatrixRefToPos(reticleRef.current.position, hitMatrix.current);
    }
  });

  // Tap screen to place object
  const handleSelect = () => {
    if (reticleRef.current) {
      const pos = reticleRef.current.position.clone();
      onSelect(pos);
    }
  };

  return (
    <Interactive onSelect={handleSelect}>
      <mesh ref={reticleRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.05, 0.06, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>
    </Interactive>
  );
};

function hitMatrixRefToPos(vector, matrix) {
  const pos = new THREE.Vector3();
  pos.setFromMatrixPosition(matrix);
  vector.copy(pos);
}

// === Array Visualization ===
const ArrayVisualization = ({ position }) => {
  const data = [10, 20, 30, 40];
  const spacing = 0.5;
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <group position={position}>
      <Text
        position={[0, 0.4, 0]}
        fontSize={0.1}
        color="white"
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
      <mesh>
        <boxGeometry args={[0.18, 0.18, 0.18]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text
        position={[0, 0.18, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}
      </Text>
      <Text
        position={[0, -0.18, 0]}
        fontSize={0.06}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>
    </group>
  );
};

export default ARPage1;
