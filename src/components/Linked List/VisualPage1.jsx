import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage1 = ({ nodes = [10, 20, 30] }) => {
  const spacing = 6.3; // spacing per node

  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <Canvas camera={{ position: [0, 4, 18], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        <Scene nodes={nodes} spacing={spacing} />
      </Canvas>
    </div>
  );
};

const Scene = ({ nodes, spacing }) => {
  const mid = (nodes.length - 1) / 2; // compute middle index

  return (
    <>
      {/* Render Nodes */}
      {nodes.map((val, idx) => (
        <Node
          key={idx}
          value={val}
          position={[(idx - mid) * spacing, 0, 0]} // center aligned
          isLast={idx === nodes.length - 1}
        />
      ))}

      <OrbitControls makeDefault />
    </>
  );
};

const Node = ({ value, position, isLast }) => {
  const size = [4.5, 2, 1]; // node box size
  const boxHalf = size[0] / 2;

  return (
    <group position={position}>
      {/* Main Box */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>

      {/* Divider line */}
      <mesh position={[0.5, 0, 0.51]}>
        <boxGeometry args={[0.05, size[1], 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Data Label */}
      <Text
        position={[-0.8, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {value}
      </Text>

      {/* Next Label */}
      <Text
        position={[1.4, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        Next
      </Text>

      {/* Arrow or Null */}
      {!isLast ? (
        <Arrow3D
          start={[boxHalf, 0, 0]}
          end={[boxHalf + 1.8, 0, 0]} // shorter arrow
        />
      ) : (
        <>
          <Arrow3D
            start={[boxHalf, 0, 0]}
            end={[boxHalf + 1.2, 0, 0]} // short arrow to null
          />
          <NullCircle offset={boxHalf + 1.8} />
        </>
      )}
    </group>
  );
};

const Arrow3D = ({ start, end }) => {
  const ref = useRef();
  const dir = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ).normalize();

  const length = new THREE.Vector3(
    end[0] - start[0],
    end[1] - start[1],
    end[2] - start[2]
  ).length();

  useFrame(() => {
    if (ref.current) {
      ref.current.setDirection(dir);
      ref.current.setLength(length, 0.4, 0.2);
    }
  });

  return (
    <primitive
      object={
        new THREE.ArrowHelper(dir, new THREE.Vector3(...start), length, "black")
      }
      ref={ref}
    />
  );
};

/* Null Circle */
const NullCircle = ({ offset }) => (
  <group position={[offset, 0, 0]}>
    <mesh>
      <circleGeometry args={[0.6, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
    <Text
      position={[0, 0, 0.4]}
      fontSize={0.3}
      anchorX="center"
      anchorY="middle"
      color="white"
    >
      null
    </Text>
  </group>
);

export default VisualPage1;
