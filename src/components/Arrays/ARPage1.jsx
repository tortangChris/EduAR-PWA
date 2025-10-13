import React, { useMemo, useState, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

// ARPage1.jsx  (rafce style)
const ARPage1 = () => {
  const defaultData = [10, 20, 30, 40];
  const [arStarted, setArStarted] = useState(false);
  const [placedScenes, setPlacedScenes] = useState([]); // each = {id, matrix: Float32Array}
  const sessionRef = useRef(null);
  const hitTestSourceRef = useRef(null);
  const viewerSpaceRef = useRef(null);
  const glRef = useRef(null);
  const nextIdRef = useRef(1);

  // Start AR session manually (user gesture required on many browsers)
  const startAR = async (gl) => {
    if (!navigator.xr) {
      alert("WebXR not available on this browser/device.");
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        alert("Immersive AR not supported on this device.");
        return;
      }

      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        // anchors support is available on some devices but is still experimental.
        // requiredFeatures: ['hit-test', 'anchors']
      });

      sessionRef.current = session;
      gl.xr.setSession(session);
      setArStarted(true);

      // Create a viewer reference space then request hit test source.
      const viewerSpace = await session.requestReferenceSpace("viewer");
      viewerSpaceRef.current = viewerSpace;
      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      hitTestSourceRef.current = hitTestSource;

      // listen for session end to cleanup
      session.addEventListener("end", () => {
        hitTestSourceRef.current && hitTestSourceRef.current.cancel();
        hitTestSourceRef.current = null;
        sessionRef.current = null;
        viewerSpaceRef.current = null;
        setArStarted(false);
      });

      // select event: place an object using hit test results
      session.addEventListener("select", (ev) => {
        // Note: using hit-test results inside animation frame is more reliable.
        // We'll create a flag and let the frame loop pick up the latest hit pose.
      });

      // keep gl ref
      glRef.current = gl;
    } catch (err) {
      console.error("Failed to start AR session:", err);
      alert("Failed to start AR session: " + (err.message || err));
    }
  };

  // Called each XR frame (we read hit-test and allow tap-to-place)
  function useXRFrameUpdater() {
    const { gl, scene } = useThree();

    useFrame((state, delta) => {
      // If we have an XR session + hit test source, read hit results
      const session = sessionRef.current;
      const hitTestSource = hitTestSourceRef.current;
      if (!session || !hitTestSource) return;

      const frame = state.gl.xr.getFrame && state.gl.xr.getFrame();
      // state.gl.xr.getFrame() may be not available on all r3f versions; instead
      // get XRFrame from state.frame (available when in xr). We'll try both.
      const xrFrame =
        state.frame || (state.gl.xr.getFrame && state.gl.xr.getFrame());
      const referenceSpace = session.isImmersive
        ? state.gl.xr.getReferenceSpace()
        : null;

      if (!xrFrame) return;

      const hitResults = xrFrame.getHitTestResults(hitTestSource);
      if (hitResults && hitResults.length > 0) {
        // Use the first hit to show a transient placement preview (optional)
        const hit = hitResults[0];
        const pose = hit.getPose(state.gl.xr.getReferenceSpace());
        if (pose) {
          // You could update a preview object here.
        }
      }

      // Check input sources for "select" events that create anchors/placements.
      // r3f does not expose select events directly here, so use session.inputSources
      // and check gamepad or transient inputs - but for simplicity we place on any
      // primary input pressed (pointerdown handled by DOM below) or using screen tap.
    });
  }
  useXRFrameUpdater();

  // DOM pointer/tap handler: when user taps the canvas, perform a hit test and place an object.
  const handleCanvasPointerDown = async (e) => {
    // If AR not started, ignore
    if (!sessionRef.current || !glRef.current) return;

    try {
      const gl = glRef.current;
      const session = sessionRef.current;
      const xrViewerRefSpace = viewerSpaceRef.current;

      // We'll request a transient hit-test at the tap position using XRWebGLLayer's coordinate system.
      // Simpler approach: use current frame via requestAnimationFrame of the XRSession to get hit results.
      session.requestAnimationFrame((time, xrFrame) => {
        const hitTestSource = hitTestSourceRef.current;
        if (!hitTestSource) return;

        // perform hit test results (already created for viewer space)
        const results = xrFrame.getHitTestResults(hitTestSource);
        if (results.length > 0) {
          const result = results[0];
          const referenceSpace = gl.xr.getReferenceSpace();
          const pose = result.getPose(referenceSpace);
          if (pose) {
            // store the pose's transform matrix for this placement
            const mat = new Float32Array(pose.transform.matrix);
            const id = nextIdRef.current++;
            setPlacedScenes((s) => [...s, { id, matrix: mat }]);
          }
        } else {
          // fallback: place 1m in front of camera
          const cam = new THREE.Matrix4();
          cam.makeTranslation(0, 0, -1);
          const camWorld = new THREE.Matrix4();
          const camera = gl.xr.getCamera ? gl.xr.getCamera() : null;
          if (camera) {
            camWorld.multiplyMatrices(camera.matrixWorld, cam);
            const mat = new Float32Array(camWorld.elements);
            const id = nextIdRef.current++;
            setPlacedScenes((s) => [...s, { id, matrix: mat }]);
          }
        }
      });
    } catch (err) {
      console.error("Error on pointer down placement:", err);
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      {/* Start AR button overlay */}
      {!arStarted && (
        <button
          style={{
            position: "absolute",
            zIndex: 10,
            left: 20,
            top: 20,
            padding: "10px 14px",
            background: "#0ea5e9",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
          onClick={() => {
            // We'll request session inside onCreated of Canvas by passing a ref.
            // But because we need a gl instance, we'll dispatch a custom event to the canvas mount.
            const evt = new CustomEvent("start-ar-request");
            window.dispatchEvent(evt);
          }}
        >
          Start AR
        </button>
      )}

      <Canvas
        vr={true}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          // enable XR on the GL context
          gl.xr.enabled = true;

          // listen to the custom start-ar-request and initialize AR session
          const handler = () => startAR(gl);
          window.addEventListener("start-ar-request", handler);

          // store gl ref even if AR not started yet
          glRef.current = gl;

          // cleanup
          return () => window.removeEventListener("start-ar-request", handler);
        }}
        onPointerDown={handleCanvasPointerDown}
        camera={{ position: [0, 1.6, 3], fov: 60 }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />

        {/* Non-AR header (floating in world) */}
        <FadeInText
          text={"Array Data Structure (Tap to place)"}
          position={[0, 1.8, 0]}
          fontSize={0.45}
          color="white"
        />

        {/* Render each placed scene (matrix-driven) */}
        {placedScenes.map((ps) => (
          <PlacedArray key={ps.id} matrix={ps.matrix} data={defaultData} />
        ))}
      </Canvas>
    </div>
  );
};

// ---------- PlacedArray: renders the 3D array at a provided world matrix ----------
const PlacedArray = ({ matrix, data = [10, 20, 30, 40], spacing = 1.9 }) => {
  const groupRef = useRef();
  const positions = useMemo(() => {
    const mid = (data.length - 1) / 2;
    return data.map((_, i) => [(i - mid) * spacing, 0, 0]);
  }, [data, spacing]);

  // apply the matrix once and then keep it (anchored-like)
  useEffect(() => {
    if (groupRef.current && matrix) {
      const m = new THREE.Matrix4();
      m.fromArray(matrix);
      groupRef.current.matrixAutoUpdate = false;
      groupRef.current.matrix.copy(m);
    }
  }, [matrix]);

  return (
    <group ref={groupRef}>
      <FadeInText
        text={"Array"}
        position={[0, 2, 0]}
        fontSize={0.5}
        color="white"
      />

      {data.map((v, i) => (
        <Box3D key={i} index={i} value={v} position={positions[i]} />
      ))}
    </group>
  );
};

// ---------- Box3D: simple clickable box with labels ----------
const Box3D = ({ index, value, position }) => {
  const [selected, setSelected] = useState(false);
  const size = [1.6, 1.2, 1];
  const color = selected ? "#facc15" : index % 2 === 0 ? "#60a5fa" : "#34d399";

  return (
    <group position={position}>
      <mesh
        position={[0, size[1] / 2, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelected((s) => !s);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={color}
          emissive={selected ? "#fbbf24" : "#000"}
          emissiveIntensity={selected ? 0.4 : 0}
        />
      </mesh>

      <Text
        position={[0, size[1] / 2 + 0.15, size[2] / 2 + 0.01]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {String(value)}
      </Text>

      <Text
        position={[0, -0.3, size[2] / 2 + 0.01]}
        fontSize={0.28}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        [{index}]
      </Text>

      {selected && (
        <Text
          position={[0, size[1] + 0.8, 0]}
          fontSize={0.28}
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

// ---------- FadeInText ----------
const FadeInText = ({
  text,
  position = [0, 0, 0],
  fontSize = 0.4,
  color = "white",
}) => {
  const ref = useRef();
  const opacity = useRef(0);

  useFrame(() => {
    if (!ref.current) return;
    opacity.current = Math.min(opacity.current + 0.04, 1);
    if (ref.current.material) ref.current.material.opacity = opacity.current;
    ref.current.scale.setScalar(0.9 + opacity.current * 0.2);
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={fontSize}
      color={color}
      anchorX="center"
      anchorY="middle"
      material-transparent
    >
      {text}
    </Text>
  );
};

export default ARPage1;
