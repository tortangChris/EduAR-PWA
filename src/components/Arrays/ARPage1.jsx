import React, { useState, useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * ARPage1.jsx
 *
 * - Uses a Start AR button (user gesture) to request an "immersive-ar" session.
 * - Binds the session to renderer via gl.xr.setSession(session).
 * - Keeps session reference and listens for 'end' event to cleanup.
 * - Places simple objects 1m in front of the camera when the user taps the screen
 *   while the AR session is active.
 *
 * NOTE: Use HTTPS or localhost. Chrome on Android is recommended for WebXR AR.
 */

const ARPage1 = () => {
  const [sessionActive, setSessionActive] = useState(false);
  const [placedObjects, setPlacedObjects] = useState([]); // {pos: [x,y,z], rot: [x,y,z,w]}
  const glRef = useRef(null);
  const xrSessionRef = useRef(null);

  // Start AR session (must be called from a user gesture)
  const startAR = async () => {
    if (!navigator.xr) {
      alert("WebXR not available on this browser.");
      return;
    }

    try {
      const supported = await navigator.xr.isSessionSupported("immersive-ar");
      if (!supported) {
        alert("AR not supported on this device/browser.");
        return;
      }

      // Request an immersive-ar session. We do minimal required features.
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: [], // keep minimal; could add 'anchors' or 'hit-test' if supported and needed
        optionalFeatures: ["local-floor", "bounded-floor", "viewer"],
      });

      // Keep session reference for later cleanup or queries.
      xrSessionRef.current = session;

      // Attach session to three renderer (we do this inside onCreated when gl available)
      if (glRef.current) {
        glRef.current.xr.setSession(session);
      }

      // Listen for end so we can cleanup state
      session.addEventListener("end", onSessionEnd);

      setSessionActive(true);
    } catch (err) {
      console.error("Failed to start AR session:", err);
      alert(
        "Could not start AR session: " +
          (err && err.message ? err.message : err)
      );
    }
  };

  const onSessionEnd = () => {
    // session ended (user exited AR) — cleanup
    xrSessionRef.current = null;
    setSessionActive(false);
    setPlacedObjects([]); // optional: clear placed content on end
  };

  // Stop AR manually (optional)
  const stopAR = async () => {
    const s = xrSessionRef.current;
    if (s) {
      await s.end();
      // onSessionEnd will run automatically via listener
    }
  };

  // This handler is called by the Canvas pointer event (we compute placement
  // using event.camera so we don't rely on hit-test here).
  const handlePointerDown = (event) => {
    // Only place objects while in an active XR session
    if (!sessionActive) return;

    // event.camera is the active camera (XR camera while presenting)
    const cam = event.camera;
    if (!cam) return;

    // compute 1 meter in front of the camera in world coordinates
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const camPos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    const placePos = camPos.clone().add(forward.multiplyScalar(1.0)); // 1 meter ahead

    // orientation: use camera quaternion (so object faces the camera)
    const rot = [
      cam.quaternion.x,
      cam.quaternion.y,
      cam.quaternion.z,
      cam.quaternion.w,
    ];
    const posArr = [placePos.x, placePos.y, placePos.z];

    setPlacedObjects((prev) => [...prev, { pos: posArr, rot }]);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        background: "black",
      }}
    >
      {/* Overlay controls */}
      <div style={{ position: "absolute", left: 12, top: 12, zIndex: 20 }}>
        {!sessionActive ? (
          <button
            onClick={startAR}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#0ea5e9",
              color: "white",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Start AR
          </button>
        ) : (
          <button
            onClick={stopAR}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#ef4444",
              color: "white",
              border: "none",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Exit AR
          </button>
        )}
      </div>

      <Canvas
        camera={{ position: [0, 1.6, 3], fov: 60 }}
        onCreated={({ gl }) => {
          // Keep a reference to gl so startAR can attach session after request
          glRef.current = gl;
          gl.xr.enabled = true;

          // If a session was already requested before gl was ready (rare), attach it now.
          if (xrSessionRef.current) {
            gl.xr.setSession(xrSessionRef.current);
          }
        }}
        onPointerDown={handlePointerDown}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 10, 4]} intensity={0.8} />

        {/* Header text floating (always visible in AR scene) */}
        <FloatingText
          text="Array in AR (tap to place)"
          position={[0, 1.8, -1]}
          size={0.5}
        />

        {/* Render placed objects */}
        {placedObjects.map((o, idx) => (
          <PlacedArray key={idx} pos={o.pos} rot={o.rot} />
        ))}
      </Canvas>
    </div>
  );
};

/* Floating text component (simple) */
const FloatingText = ({ text, position = [0, 1.5, -1], size = 0.4 }) => {
  return (
    <group position={position}>
      <Text fontSize={size} anchorX="center" anchorY="middle" maxWidth={5}>
        {text}
      </Text>
    </group>
  );
};

/* PlacedArray: simple array visualization (boxes) placed at a world transform */
const PlacedArray = ({ pos = [0, 0, -2], rot = [0, 0, 0, 1] }) => {
  const data = [10, 20, 30, 40];
  const spacing = 1.8;
  const mid = (data.length - 1) / 2;

  return (
    <group
      position={pos}
      quaternion={new THREE.Quaternion(...rot)}
      scale={[0.9, 0.9, 0.9]}
    >
      <Text
        position={[0, 1.2, 0]}
        fontSize={0.36}
        anchorX="center"
        anchorY="middle"
      >
        Array
      </Text>

      {data.map((v, i) => {
        const x = (i - mid) * spacing;
        const color = i % 2 === 0 ? "#60a5fa" : "#34d399";
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[1.2, 0.9, 0.9]} />
              <meshStandardMaterial color={color} />
            </mesh>

            <Text
              position={[0, 1.05, 0.48]}
              fontSize={0.28}
              anchorX="center"
              anchorY="middle"
            >
              {String(v)}
            </Text>

            <Text
              position={[0, -0.15, 0.48]}
              fontSize={0.22}
              color="yellow"
              anchorX="center"
              anchorY="middle"
            >
              [{i}]
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export default ARPage1;
