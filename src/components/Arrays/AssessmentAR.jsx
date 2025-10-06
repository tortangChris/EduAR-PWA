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

    // ✅ Enable AR session directly (no button)
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => {
          renderer.xr.setSession(session);
        })
        .catch((err) => console.error("❌ AR session failed:", err));
    }

    // ✅ Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // ✅ Create a parent group (like reference)
    const group = new THREE.Group();
    group.position.set(0, 1, -2); // ⬅️ same as ARPage1
    group.scale.set(0.1, 0.1, 0.1);
    scene.add(group);

    // ✅ Add the main cube
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(6, 6, 6),
      new THREE.MeshStandardMaterial({ color: "#60a5fa", emissive: "black" })
    );
    cube.position.set(0, 3, 0);
    group.add(cube);

    // ✅ Add ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.3 })
    );
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // ✅ Raycaster + tap interaction
    const raycaster = new THREE.Raycaster();

    const onSelect = () => {
      setDebugText("✅ Object tapped!");
      setTimeout(() => setDebugText(""), 1500);
      cube.material.color.set("#22c55e");
      setTimeout(() => cube.material.color.set("#60a5fa"), 1000);
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // ✅ Render loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // ✅ Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-screen relative bg-black">
      {/* ✅ Debug message overlay */}
      {debugText && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-xl text-lg">
          {debugText}
        </div>
      )}
    </div>
  );
};

export default AssessmentAR;
