import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// === Main AR Page ===
const ARPage1 = () => {
  const [anchors, setAnchors] = useState([]);
  const [placed, setPlaced] = useState(false);

  // when user taps, create an anchor (tap point)
  const handleClick = (event) => {
    const { x, y } = event.pointer;
    if (!placed) {
      setAnchors([{ x, y }]);
      setPlaced(true);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "black" }}>
      <Canvas
        camera={{ position: [0, 2, 6], fov: 50 }}
        onPointerDown={handleClick}
        gl={{ xrCompatible: true }}
        onCreated={({ gl }) => {
          gl.xr.enabled = true;
          navigator.xr?.isSessionSupported("immersive-ar").then((supported) => {
            if (supported) {
              gl.xr.setSession(null);
              navigator.xr
                .requestSession("immersive-ar", {
                  requiredFeatures: ["hit-test"],
                })
                .then((session) => {
                  gl.xr.setSession(session);
                });
            } else {
              alert("AR not supported on this device.");
            }
          });
        }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 5, 2]} intensity={0.8} />

        {anchors.map((anchor, i) => (
          <ArrayAR key={i} />
        ))}
      </Canvas>
    </div>
  );
};

// === Array visualization to place in AR ===
const ArrayAR = () => {
  const data = [10, 20, 30, 40];
  const spacing = 2;
  const [selected, setSelected] = useState(null);
  const [panelVisible, setPanelVisible] = useState(false);

  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  return (
    <group position={[0, 0, -2]}>
      <FadeInText
        text="Array in AR"
        position={[0, 3, 0]}
        fontSize={0.6}
        color="white"
      />

      {data.map((v, i) => (
        <BoxAR
          key={i}
          index={i}
          value={v}
          position={positions[i]}
          selected={selected === i}
          onSelect={() => setSelected(selected === i ? null : i)}
          onShowPanel={() => setPanelVisible((p) => !p)}
        />
      ))}

      {panelVisible && (
        <DefinitionPanel
          position={[0, -3, 0]}
          data={data}
          onClose={() => setPanelVisible(false)}
        />
      )}
    </group>
  );
};

// === Box for AR (clickable cube) ===
const BoxAR = ({ index, value, position, selected, onSelect, onShowPanel }) => {
  const color = selected ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399";

  return (
    <group position={position}>
      <mesh position={[0, 0.6, 0]} onClick={onSelect}>
        <boxGeometry args={[1.6, 1.2, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000"}
          emissiveIntensity={selected ? 0.5 : 0}
        />
      </mesh>

      {/* value label */}
      <Text
        position={[0, 1.1, 0.6]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      {/* index label */}
      <Text
        position={[0, -0.3, 0.6]}
        fontSize={0.3}
        color="yellow"
        anchorX="center"
        anchorY="middle"
        onClick={onShowPanel}
      >
        [{index}]
      </Text>

      {selected && (
        <Text
          position={[0, 1.8, 0]}
          fontSize={0.3}
          color="#fde68a"
          anchorX="center"
          anchorY="middle"
        >
          Value {value} at index {index}
        </Text>
      )}
    </group>
  );
};

// === Info panel ===
const DefinitionPanel = ({ data, position, onClose }) => {
  const content = [
    "📘 Array Index Summary:",
    "",
    ...data.map((v, i) => `• Index ${i} → value ${v}`),
  ].join("\n");

  return (
    <group position={position}>
      <FadeInText
        text={content}
        position={[0, 0, 0]}
        fontSize={0.3}
        color="#fff"
      />
      <Text
        position={[0, -1.5, 0]}
        fontSize={0.4}
        color="#38bdf8"
        onClick={onClose}
      >
        Close ✖
      </Text>
    </group>
  );
};

// === Fade-in text ===
const FadeInText = ({ text, position, fontSize, color }) => {
  const ref = useRef();
  const opacity = useRef(0);

  useFrame(() => {
    if (ref.current && ref.current.material) {
      opacity.current = Math.min(opacity.current + 0.05, 1);
      ref.current.material.opacity = opacity.current;
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      material-transparent
      maxWidth={8}
      textAlign="center"
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
};

export default ARPage1;
