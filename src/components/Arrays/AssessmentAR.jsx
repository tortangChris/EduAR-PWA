import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton.js";

const AssessmentAR = () => {
  const containerRef = useRef();

  useEffect(() => {
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
    containerRef.current.appendChild(renderer.domElement);

    // ✅ Add AR Button
    document.body.appendChild(
      ARButton.createButton(renderer, { requiredFeatures: ["hit-test"] })
    );

    // ✅ Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // ✅ Object setup (from your code)
    const geometry = "cube"; // change to 'sphere' if needed
    const material = new THREE.MeshStandardMaterial({
      color: "#60a5fa",
      emissive: "black",
    });
    const mesh =
      geometry === "cube"
        ? new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), material)
        : new THREE.Mesh(new THREE.SphereGeometry(0.175, 32, 32), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // ✅ Reticle setup (placement indicator)
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // ✅ Variables for hit testing
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    // ✅ Tap handler (with alert debug)
    function onSelect() {
      alert("✅ Tap detected! Object placed.");
      if (reticle.visible) {
        const newObj = mesh.clone();
        newObj.position.setFromMatrixPosition(reticle.matrix);
        scene.add(newObj);
      }
    }

    // ✅ AR Session Start
    renderer.xr.addEventListener("sessionstart", () => {
      const session = renderer.xr.getSession();
      session.addEventListener("select", onSelect);
    });

    // ✅ Animation loop
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const session = renderer.xr.getSession();
        const referenceSpace = renderer.xr.getReferenceSpace();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace("viewer").then((refSpace) => {
            session
              .requestHitTestSource({ space: refSpace })
              .then((source) => (hitTestSource = source));
          });

          session.addEventListener("end", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
          });

          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);
          if (hitTestResults.length) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(referenceSpace);
            reticle.visible = true;
            reticle.matrix.fromArray(pose.transform.matrix);
          } else {
            reticle.visible = false;
          }
        }
      }

      renderer.render(scene, camera);
    });

    // ✅ Resize handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ✅ Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default AssessmentAR;
