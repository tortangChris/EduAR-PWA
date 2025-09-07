import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

const VisualPage2 = ({ nodes = [10, 20, 30], stepDuration = 2000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instruction, setInstruction] = useState("Starting at Head");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < nodes.length) {
        setCurrentIndex(currentIndex + 1);
        if (currentIndex + 1 < nodes.length) {
          setInstruction(`Move to next node: ${nodes[currentIndex + 1]}`);
        } else {
          setInstruction("Reached Tail → NULL");
        }
      } else {
        setInstruction("Reached NULL, restarting...");
        setTimeout(() => {
          setCurrentIndex(0);
          setInstruction("Starting at Head");
        }, stepDuration);
      }
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [currentIndex, nodes, stepDuration]);

  const spacing = 6.3;

  return (
    <div className="w-full h-[400px] flex flex-col items-center justify-center">
      <div className="text-xl font-bold mb-4">{instruction}</div>
      <Canvas camera={{ position: [0, 5, 18], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Scene nodes={nodes} spacing={spacing} currentIndex={currentIndex} />
      </Canvas>
    </div>
  );
};

const Scene = ({ nodes, spacing, currentIndex }) => {
  const mid = (nodes.length - 1) / 2;

  return (
    <>
      {nodes.map((val, idx) => (
        <Node
          key={idx}
          value={val}
          position={[(idx - mid) * spacing, 0, 0]}
          isHead={idx === 0}
          isLast={idx === nodes.length - 1}
          isActive={idx === currentIndex}
          highlightNull={currentIndex === nodes.length}
        />
      ))}
      <OrbitControls makeDefault />
    </>
  );
};

const Node = ({
  value,
  position,
  isHead,
  isLast,
  isActive,
  highlightNull,
  currentIndex,
  nodeIndex,
}) => {
  const size = [4.5, 2, 1];
  const boxHalf = size[0] / 2;

  // Refs for bouncing
  const labelGroupRef = useRef(); // Head label
  const arrowLabelRef = useRef(); // arrow between nodes
  const nullArrowRef = useRef(); // arrow for NULL
  const tailLabelRef = useRef(); // tail label above last node

  // Bouncing animation
  useFrame(({ clock }) => {
    if (labelGroupRef.current) {
      labelGroupRef.current.position.y =
        2.2 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    }
    if (arrowLabelRef.current) {
      arrowLabelRef.current.position.y =
        1.5 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
    if (nullArrowRef.current) {
      nullArrowRef.current.position.y =
        1.5 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
    if (tailLabelRef.current) {
      tailLabelRef.current.position.y =
        2.0 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
  });

  const arrowActive = currentIndex === nodeIndex;

  return (
    <group position={position}>
      {/* Node Box */}
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={isActive ? "#facc15" : "#3b82f6"} />
      </mesh>

      {/* Divider */}
      <mesh position={[0.5, 0, 0.51]}>
        <boxGeometry args={[0.05, size[1], 0.05]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Head Label */}
      {isHead && (
        <group ref={labelGroupRef}>
          <Text fontSize={0.4} anchorX="center" anchorY="middle" color="yellow">
            Head
          </Text>
          <Arrow3D start={[0, -0.1, 0]} end={[0, -1.2, 0]} color="yellow" />
        </group>
      )}

      {/* Value and Next */}
      <Text
        position={[-0.8, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        {value}
      </Text>
      <Text
        position={[1.4, 0, 0.55]}
        fontSize={0.35}
        anchorX="center"
        anchorY="middle"
        color="white"
      >
        Next
      </Text>

      {/* Label below node */}
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.25}
        anchorX="center"
        anchorY="middle"
        color="lightblue"
      >
        Node
      </Text>

      {/* Tail label above last node */}
      {isLast && (
        <group ref={tailLabelRef} position={[0, 2.0, 0]}>
          <Text
            fontSize={0.35}
            anchorX="center"
            anchorY="middle"
            color="yellow"
          >
            Tail Node
          </Text>
          <Arrow3D start={[0, -0.1, 0]} end={[0, -1.0, 0]} color="yellow" />
        </group>
      )}

      {/* Arrows */}
      {!isLast ? (
        <>
          {/* Arrow to next node */}
          <Arrow3D
            start={[boxHalf, 0, 0]}
            end={[boxHalf + 1.8, 0, 0]}
            color={arrowActive ? "#facc15" : "black"}
          />
          <group ref={arrowLabelRef} position={[boxHalf + 0.9, 1.5, 0]}>
            <Text
              fontSize={0.25}
              anchorX="center"
              anchorY="middle"
              color="orange"
            >
              Reference to The Next Node
            </Text>
            <Arrow3D start={[0, -0.1, 0]} end={[0, -0.8, 0]} color="orange" />
          </group>
        </>
      ) : (
        <>
          {/* Arrow to NULL */}
          <Arrow3D
            start={[boxHalf, 0, 0]}
            end={[boxHalf + 1.2, 0, 0]}
            color={arrowActive ? "#facc15" : "black"}
          />
          <NullCircle offset={boxHalf + 1.8} highlight={highlightNull} />
          {/* Label + arrow to NULL */}
          <group ref={nullArrowRef} position={[boxHalf + 1.2, 1.5, 0]}>
            <Text
              fontSize={0.25}
              anchorX="center"
              anchorY="middle"
              color="orange"
            >
              Reference to NULL
            </Text>
            <Arrow3D start={[0, -0.1, 0]} end={[0, -0.8, 0]} color="orange" />
          </group>
        </>
      )}
    </group>
  );
};

const Arrow3D = ({ start, end, color = "black" }) => {
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
        new THREE.ArrowHelper(dir, new THREE.Vector3(...start), length, color)
      }
      ref={ref}
    />
  );
};

const NullCircle = ({ offset, highlight }) => (
  <group position={[offset, 0, 0]}>
    <mesh>
      <circleGeometry args={[0.6, 32]} />
      <meshStandardMaterial color={highlight ? "#facc15" : "red"} />
    </mesh>
    <Text
      position={[0, 0, 0.4]}
      fontSize={0.3}
      anchorX="center"
      anchorY="middle"
      color="white"
    >
      NULL
    </Text>
  </group>
);

export default VisualPage2;
