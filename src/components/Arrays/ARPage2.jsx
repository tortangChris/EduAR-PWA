import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ARPage2 = () => {
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

    // ✅ Start AR session directly
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => renderer.xr.setSession(session))
        .catch((err) => console.error("❌ AR session failed:", err));
    }

    // ✅ Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // ✅ Group setup
    const group = new THREE.Group();
    group.position.set(0, 1, -2);
    group.scale.set(0.1, 0.1, 0.1);
    scene.add(group);

    // ✅ Data + box creation
    const data = [10, 20, 30, 40, 50];
    const spacing = 8;
    const boxes = [];
    const fontLoader = new THREE.FontLoader();

    for (let i = 0; i < data.length; i++) {
      const geometry = new THREE.BoxGeometry(6, 6, 6);
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? "#60a5fa" : "#34d399",
        emissive: "black",
      });
      const box = new THREE.Mesh(geometry, material);
      box.position.set((i - (data.length - 1) / 2) * spacing, 3, 0);
      box.userData = { index: i, value: data[i] };
      group.add(box);
      boxes.push(box);
    }

    // ✅ Raycaster for interaction
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    let codeLabel = null;

    const generateCode = (index, value) => {
      return [
        "📘 Pseudo Code Example:",
        "",
        "array = [10, 20, 30, 40, 50]",
        `index = ${index}`,
        "",
        "value = array[index]",
        "print('Accessed Value:', value)",
        "",
        `// Result: ${value}`,
      ].join("\n");
    };

    const createFloatingLabel = (text, position) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      context.font = "bold 60px Arial";
      const lines = text.split("\n");

      // Dynamic canvas height
      const lineHeight = 70;
      const width = 1600;
      const height = lineHeight * lines.length + 100;
      canvas.width = width;
      canvas.height = height;
      context.fillStyle = "rgba(0,0,0,0.7)";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#c7d2fe";
      context.textAlign = "left";
      context.textBaseline = "top";

      lines.forEach((line, i) => {
        context.fillText(line, 50, 50 + i * lineHeight);
      });

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(25, (height / width) * 25, 1);
      sprite.position.copy(position);
      return sprite;
    };

    const onSelect = (event) => {
      const controller = event.target;
      tempMatrix.identity().extractRotation(controller.matrixWorld);
      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObjects(boxes);
      if (intersects.length > 0) {
        const selected = intersects[0].object;
        const { index, value } = selected.userData;

        setDebugText(`✅ Box ${index + 1} tapped!`);
        selected.material.color.set("#f87171");

        // Remove old label
        if (codeLabel) {
          group.remove(codeLabel);
          codeLabel.material.map.dispose();
          codeLabel.material.dispose();
        }

        // Add new label
        const codeText = generateCode(index, value);
        codeLabel = createFloatingLabel(
          codeText,
          new THREE.Vector3(selected.position.x, selected.position.y + 10, 0)
        );
        group.add(codeLabel);

        // Reset after delay
        setTimeout(() => {
          selected.material.color.set(index % 2 === 0 ? "#60a5fa" : "#34d399");
          setDebugText("");
        }, 2000);
      }
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // ✅ Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.ShadowMaterial({ opacity: 0.25 })
    );
    ground.rotation.x = -Math.PI / 2;
    group.add(ground);

    // ✅ Render loop
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // ✅ Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ✅ Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.setAnimationLoop(null);
      try {
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      } catch (e) {
        console.warn("⚠️ Renderer cleanup:", e.message);
      }
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

export default ARPage2;
