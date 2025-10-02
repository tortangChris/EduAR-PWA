import React, { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const ARPage2 = ({
  nodes = [10, 20, 30],
  stepDuration = 2000,
  spacing = 6.3,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [instruction, setInstruction] = useState("Starting at Head");
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    if (!placed) return;

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
  }, [currentIndex, nodes, stepDuration, placed]);

  return (
    <div className="w-full h-screen">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xl font-bold z-50">
        {instruction}
      </div>
      <Canvas
        camera={{ position: [0, 5, 18], fov: 50 }}
        gl={{ alpha: true }}
        shadows
        onCreated={({ gl }) => {
          gl.xr.enabled = true;

          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["hit-test", "local-floor"],
              })
              .then((session) => gl.xr.setSession(session))
              .catch((err) =>
                console.error("❌ Failed to start AR session:", err)
              );
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

        <Reticle placed={placed} setPlaced={setPlaced}>
          <group>
            {/* AR Instruction Text at the top */}
            {placed && (
              <Text
                position={[0, 6, 0]} // high above nodes
                fontSize={0.7}
                color="yellow"
                anchorX="center"
                anchorY="middle"
              >
                {instruction}
              </Text>
            )}

            {/* The node scene */}
            <Scene
              nodes={nodes}
              spacing={spacing}
              currentIndex={currentIndex}
            />

            {/* Shadow plane */}
            <mesh rotation-x={-Math.PI / 2} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <shadowMaterial opacity={0.3} />
            </mesh>
          </group>
        </Reticle>
      </Canvas>
    </div>
  );
};

function Reticle({ children, placed, setPlaced }) {
  const { gl } = useThree();
  const reticleRef = useRef();
  const [hitTestSource, setHitTestSource] = useState(null);
  const [hitTestSourceRequested, setHitTestSourceRequested] = useState(false);
  const [progress, setProgress] = useState(0);
  const [targetPos, setTargetPos] = useState(null);

  useFrame((_, delta) => {
    const session = gl.xr.getSession();
    if (!session) return;
    const frame = gl.xr.getFrame();
    if (!frame) return;

    if (!hitTestSourceRequested) {
      session.requestReferenceSpace("viewer").then((refSpace) => {
        session
          .requestHitTestSource({ space: refSpace })
          .then(setHitTestSource);
      });
      setHitTestSourceRequested(true);
    }

    if (hitTestSource && !placed) {
      const referenceSpace = gl.xr.getReferenceSpace();
      const hits = frame.getHitTestResults(hitTestSource);

      if (hits.length > 0) {
        const pose = hits[0].getPose(referenceSpace);

        reticleRef.current.visible = true;
        reticleRef.current.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );
        reticleRef.current.updateMatrixWorld(true);

        setProgress((prev) => {
          const next = Math.min(prev + delta / 2, 1); // 2 sec hold
          if (next >= 1 && !placed) {
            setPlaced(true);
            setTargetPos(pose.transform.position);
          }
          return next;
        });
      } else {
        reticleRef.current.visible = false;
        setProgress(0);
      }
    }
  });

  return (
    <group>
      <mesh ref={reticleRef} rotation-x={-Math.PI / 2} visible={false}>
        <ringGeometry args={[0.07, 0.1, 32]} />
        <meshBasicMaterial color="yellow" />
      </mesh>

      {reticleRef.current && !placed && (
        <mesh position={reticleRef.current.position} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[0.05, 0.09, 32, 1, 0, Math.PI * 2 * progress]} />
          <meshBasicMaterial color="lime" transparent opacity={0.8} />
        </mesh>
      )}

      {placed && targetPos && (
        <group
          position={[targetPos.x, targetPos.y, targetPos.z]}
          scale={[0.1, 0.1, 0.1]}
        >
          {children}
        </group>
      )}
    </group>
  );
}

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
          nodeIndex={idx}
        />
      ))}
    </>
  );
};

// Node, Arrow3D, and NullCircle remain exactly the same as your VisualPage2
const Node = ({
  value,
  position,
  isHead,
  isLast,
  isActive,
  highlightNull,
  nodeIndex,
}) => {
  const size = [4.5, 2, 1];
  const boxHalf = size[0] / 2;
  const labelGroupRef = useRef();
  const arrowLabelRef = useRef();
  const nullArrowRef = useRef();
  const tailLabelRef = useRef();

  useFrame(({ clock }) => {
    if (labelGroupRef.current)
      labelGroupRefRef.current.position.y =
        2.2 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
    if (arrowLabelRef.current)
      arrowLabelRef.current.position.y =
        1.5 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    if (nullArrowRef.current)
      nullArrowRef.current.position.y =
        1.5 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    if (tailLabelRef.current)
      tailLabelRef.current.position.y =
        2.0 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
  });

  const arrowActive = nodeIndex === undefined ? false : nodeIndex === nodeIndex;

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

      {/* Value & Next */}
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

      {/* Tail label */}
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
          <Arrow3D
            start={[boxHalf, 0, 0]}
            end={[boxHalf + 1.2, 0, 0]}
            color={arrowActive ? "#facc15" : "black"}
          />
          <NullCircle offset={boxHalf + 1.8} highlight={highlightNull} />
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

export default ARPage2;
