import React, { useMemo, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import useSound from "use-sound";
import dingSfx from "/sounds/ding.mp3";

const ARPage1 = ({ data = [10, 20, 30, 40], spacing = 2.0 }) => {
  const [timeStep, setTimeStep] = useState(0);
  const [lastStage, setLastStage] = useState(-1);
  const [activeIndex, setActiveIndex] = useState(null);
  const [playDing] = useSound(dingSfx, { volume: 0.5 });

  // timeline control (0–15 seconds loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStep((prev) => (prev + 1) % 15);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Trigger ding kada may bagong stage
  useEffect(() => {
    const stages = [0, 3, 5, 8, 10];
    if (stages.includes(timeStep) && timeStep !== lastStage) {
      playDing();
      setLastStage(timeStep);
    }
  }, [timeStep, lastStage, playDing]);

  // positions
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
          gl.xr.enabled = true;
          if (navigator.xr) {
            navigator.xr
              .requestSession("immersive-ar", {
                requiredFeatures: ["local-floor"],
              })
              .then((session) => gl.xr.setSession(session))
              .catch((err) =>
                console.error("Failed to start AR session:", err)
              );
          }
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} castShadow />

        {/* Timeline Text */}
        {timeStep >= 0 && (
          <FadeInText
            text="This is an Array"
            show={timeStep >= 0}
            position={[0, 2, -3]}
            fontSize={0.6}
            color="white"
          />
        )}

        {/* Boxes */}
        <group position={[0, 0, -3]} scale={[0.2, 0.2, 0.2]}>
          {timeStep >= 3 &&
            data.map((value, i) => (
              <Box
                key={i}
                index={i}
                value={value}
                position={positions[i]}
                showIndex={timeStep >= 8}
                isActive={activeIndex === i}
              />
            ))}

          {/* Shadow plane */}
          <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, -0.1, 0]}>
            <planeGeometry args={[10, 10]} />
            <shadowMaterial opacity={0.3} />
          </mesh>
        </group>

        {/* Arrows + Labels */}
        {timeStep >= 5 && (
          <>
            <FadeInArrow from={[-6, 0.5, -3]} to={[-4, 0.5, -3]} />
            <FadeInText
              text="Elements / Values"
              show={timeStep >= 5}
              position={[-6, 0.5, -3]}
              fontSize={0.35}
              color="orange"
              anchorX="right"
            />
          </>
        )}
        {timeStep >= 10 && (
          <>
            <FadeInArrow from={[-6, -0.5, -3]} to={[-3.5, -0.5, -3]} />
            <FadeInText
              text="Indices"
              show={timeStep >= 10}
              position={[-6, -0.5, -3]}
              fontSize={0.35}
              color="yellow"
              anchorX="right"
            />
          </>
        )}

        {/* Tap Controls */}
        <TapControls setActiveIndex={setActiveIndex} />
      </Canvas>
    </div>
  );
};

// === Fade-in Text ===
const FadeInText = ({
  show,
  text,
  position,
  fontSize,
  color,
  anchorX = "center",
  anchorY = "middle",
}) => {
  const ref = useRef();
  const opacity = useRef(0);
  const scale = useRef(0.5);

  useFrame(() => {
    if (show) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      scale.current = Math.min(scale.current + 0.05, 1);
    } else {
      opacity.current = 0;
      scale.current = 0.5;
    }
    if (ref.current) {
      ref.current.material.opacity = opacity.current;
      ref.current.scale.set(scale.current, scale.current, scale.current);
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      anchorX={anchorX}
      anchorY={anchorY}
      color={color}
      material-transparent
    >
      {text}
    </Text>
  );
};

// === Fade-in Arrow ===
const FadeInArrow = ({ from, to }) => {
  const ref = useRef();
  const opacity = useRef(0);
  const dir = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  ).normalize();
  const length = new THREE.Vector3(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2]
  ).length();

  useFrame(() => {
    opacity.current = Math.min(opacity.current + 0.05, 1);
    if (ref.current)
      ref.current.setColor(
        new THREE.Color(`rgba(255,255,255,${opacity.current})`)
      );
  });

  return (
    <primitive
      ref={ref}
      object={
        new THREE.ArrowHelper(dir, new THREE.Vector3(...from), length, "white")
      }
    />
  );
};

// === Box ===
const Box = ({
  index,
  value,
  position = [0, 0, 0],
  showIndex = false,
  isActive = false,
}) => {
  const size = [1.6, 1.2, 1];

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        position={[0, size[1] / 2, 0]}
        userData={{ index, value }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={index % 2 === 0 ? "#60a5fa" : "#34d399"}
          emissive={isActive ? "#facc15" : "black"}
          emissiveIntensity={isActive ? 1 : 0}
        />
      </mesh>
      <FadeInText
        show
        text={String(value)}
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        color="white"
      />
      {showIndex && (
        <FadeInText
          show
          text={`[${index}]`}
          position={[0, -0.3, size[2] / 2 + 0.01]}
          fontSize={0.25}
          color="yellow"
        />
      )}
    </group>
  );
};

// === TapControls ===
const TapControls = ({ setActiveIndex }) => {
  const { gl, camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());

  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    const onSelect = () => {
      const viewerPose = gl.xr.getCamera(camera);
      if (!viewerPose) return;

      const origin = new THREE.Vector3();
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
        viewerPose.quaternion
      );
      raycaster.current.set(origin, direction);

      const intersects = raycaster.current.intersectObjects(
        scene.children,
        true
      );
      if (intersects.length > 0) {
        const first = intersects[0].object;
        const { index } = first.userData;
        if (index !== undefined) setActiveIndex(index);
      }
    };

    session.addEventListener("select", onSelect);
    return () => session.removeEventListener("select", onSelect);
  }, [gl, camera, scene, setActiveIndex]);

  return null;
};

export default ARPage1;
