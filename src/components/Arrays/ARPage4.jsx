// ARPage4_Insertion_Hardcoded.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

const ARPage4 = ({
  data = [10, 20, 30, 40],
  spacing = 2.0,
  insertValue = 90,
  insertIndex = 2,
}) => {
  const [boxes, setBoxes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [operationText, setOperationText] = useState("Waiting to place...");
  const [placed, setPlaced] = useState(false);

  // positions for boxes
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  useEffect(() => {
    if (!placed) return;

    const steps = [
      {
        text: `Insert ${insertValue} at index ${insertIndex}`,
        arr: data,
        highlight: null,
        delay: 2000,
      },
      {
        text: `Appending ${insertValue}...`,
        arr: [...data, insertValue],
        highlight: data.length,
        delay: 2000,
      },
      {
        text: `Comparing ${insertValue} with 40...`,
        arr: [...data, insertValue],
        highlight: data.length - 1,
        delay: 2000,
      },
      {
        text: `Placing ${insertValue} at index ${insertIndex}`,
        arr: [
          ...data.slice(0, insertIndex),
          insertValue,
          ...data.slice(insertIndex),
        ],
        highlight: insertIndex,
        delay: 2000,
      },
      {
        text: `✅ Insertion complete`,
        arr: [
          ...data.slice(0, insertIndex),
          insertValue,
          ...data.slice(insertIndex),
        ],
        highlight: null,
        delay: 3000,
      },
    ];

    let currentStep = 0;
    let loop;

    const runStep = () => {
      const step = steps[currentStep];
      setOperationText(step.text);
      setBoxes(step.arr);
      setActiveIndex(step.highlight);

      loop = setTimeout(() => {
        currentStep++;
        if (currentStep >= steps.length) {
          currentStep = 0; // restart loop
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
                requiredFeatures: ["hit-test", "local-floor"],
              })
              .then((session) => gl.xr.setSession(session))
              .catch((err) => console.error("❌ AR session failed:", err));
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        <Reticle placed={placed} setPlaced={setPlaced}>
          {/* Text above */}
          <Text
            position={[0, 3, 0]}
            fontSize={0.5}
            anchorX="center"
            anchorY="middle"
            color="white"
          >
            {operationText}
          </Text>

          {/* Boxes */}
          {boxes.map((value, i) => {
            const mid = (boxes.length - 1) / 2;
            return (
              <Box
                key={i}
                index={i}
                value={value}
                position={[(i - mid) * spacing, 0, 0]}
                highlight={activeIndex === i}
              />
            );
          })}

          {/* Ground plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
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
        session.requestHitTestSource({ space: refSpace }).then((source) => {
          setHitTestSource(source);
        });
      });
      setHitTestSourceRequested(true);
    }

    if (hitTestSource && !placed) {
      const referenceSpace = gl.xr.getReferenceSpace();
      const hits = frame.getHitTestResults(hitTestSource);

      if (hits.length > 0) {
        const hit = hits[0];
        const pose = hit.getPose(referenceSpace);

        reticleRef.current.visible = true;
        reticleRef.current.position.set(
          pose.transform.position.x,
          pose.transform.position.y,
          pose.transform.position.z
        );
        reticleRef.current.updateMatrixWorld(true);

        setProgress((prev) => {
          const next = Math.min(prev + delta / 2, 1);
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

export default ARPage4;
