import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const AssessmentAR = () => {
  const containerRef = useRef();
  const [debugText, setDebugText] = useState("");

  useEffect(() => {
    const container = containerRef.current;

    // ✅ Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // ✅ Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // ✅ Main AR group
    const group = new THREE.Group();
    group.position.set(0, 1, -2);
    group.scale.set(0.1, 0.1, 0.1);
    scene.add(group);

    // ✅ Cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 6),
      new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "black" })
    );
    cube.position.set(0, 3, 0);
    group.add(cube);

    // ✅ Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // ✅ Variables for dragging
    let dragging = false;
    let hitTestSource = null;
    let localSpace = null;
    let reticle = null;

    // ✅ Create reticle (for placement / drag indicator)
    reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: "#22c55e" })
    );
    reticle.visible = false;
    scene.add(reticle);

    // ✅ Setup controller
    const controller = renderer.xr.getController(0);
    scene.add(controller);

    controller.addEventListener("selectstart", () => {
      dragging = true;
      setDebugText("🟢 Dragging started");
    });

    controller.addEventListener("selectend", () => {
      dragging = false;
      setDebugText("✅ Dragging stopped");
      setTimeout(() => setDebugText(""), 1500);
    });

    // ✅ Initialize AR Session with hit-test
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", {
          requiredFeatures: ["hit-test", "local-floor"],
        })
        .then(async (session) => {
          renderer.xr.setSession(session);
          const referenceSpace = await session.requestReferenceSpace("local");
          localSpace = referenceSpace;

          const viewerSpace = await session.requestReferenceSpace("viewer");
          hitTestSource = await session.requestHitTestSource({
            space: viewerSpace,
          });

          session.addEventListener("end", () => {
            hitTestSource = null;
          });
        })
        .catch((err) => console.error("❌ AR session failed:", err));
    }

    // ✅ Animation loop
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame && hitTestSource && localSpace) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length > 0) {
          const pose = hitTestResults[0].getPose(localSpace);
          reticle.visible = true;
          reticle.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          );

          // ✅ While dragging, move cube to reticle
          if (dragging) {
            cube.position.copy(reticle.position);
          }
        } else {
          reticle.visible = false;
        }
      }

      renderer.render(scene, camera);
    });

    // ✅ Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ✅ Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      try {
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      } catch (e) {
        console.warn("⚠️ Renderer element already removed:", e.message);
      }
      renderer.setAnimationLoop(null);
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {debugText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg">
          {debugText}
        </div>
      )}
    </div>
  );
};

export default AssessmentAR;
