import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ARPage1 = () => {
  const containerRef = useRef();
  const [debugText, setDebugText] = useState("");

  useEffect(() => {
    const container = containerRef.current;

    // === Scene Setup ===
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

    // === Start AR session ===
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => renderer.xr.setSession(session))
        .catch((err) => console.error("❌ AR session failed:", err));
    }

    // === Lighting ===
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(1, 2, 1);
    scene.add(dirLight);

    // === Main group ===
    const group = new THREE.Group();
    group.position.set(0, 1.1, -1.5);
    group.scale.set(0.05, 0.05, 0.05);
    scene.add(group);

    // === Data ===
    const data = [10, 20, 30, 40];
    const spacing = 15;
    const boxRefs = [];

    // === Title ===
    const title = makeTextSprite("Array Data Structure", {
      fontsize: 140,
      textColor: "#ffffff",
      fontface: "Arial",
    });
    title.position.set(0, 55, 0);
    group.add(title);

    // === Boxes + Labels ===
    data.forEach((value, i) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(8, 6, 4),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? "#60a5fa" : "#34d399",
          roughness: 0.5,
          metalness: 0.2,
        })
      );
      box.position.set((i - (data.length - 1) / 2) * spacing, 6, 0);
      box.userData = { index: i, value };
      group.add(box);
      boxRefs.push(box);

      // Value label
      const valueLabel = makeTextSprite(String(value), {
        fontsize: 100,
        textColor: "#ffffff",
      });
      valueLabel.position.set(box.position.x, 12, 2.5);
      group.add(valueLabel);

      // Index label
      const indexLabel = makeTextSprite(`[${i}]`, {
        fontsize: 80,
        textColor: "#facc15",
      });
      indexLabel.position.set(box.position.x, -2, 2.5);
      group.add(indexLabel);
    });

    // === Info Panel ===
    const infoPanel = makeTextSprite(
      "📘 Understanding Index in Arrays:\n\n• Index starts at 0\n• Access is O(1) in arrays\n• Stored in contiguous memory",
      { fontsize: 80, textColor: "#fde68a" }
    );
    infoPanel.position.set(70, 10, 0);
    infoPanel.visible = false;
    group.add(infoPanel);

    // === Raycaster for AR tap interaction ===
    const raycaster = new THREE.Raycaster();

    const onSelect = (event) => {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const frame = event.frame;
      const inputSource = event.inputSource;

      if (!inputSource.targetRaySpace || !frame) return;

      const pose = frame.getPose(inputSource.targetRaySpace, referenceSpace);
      if (!pose) return;

      const origin = new THREE.Vector3().fromArray(pose.transform.position);
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
        new THREE.Quaternion().fromArray(pose.transform.orientation)
      );

      raycaster.set(origin, direction);
      const intersects = raycaster.intersectObjects(boxRefs, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const { index, value } = hit.userData;

        // Highlight
        hit.material.color.set("#facc15");
        setTimeout(
          () => hit.material.color.set(index % 2 === 0 ? "#60a5fa" : "#34d399"),
          1000
        );

        // Floating label
        const floatLabel = makeTextSprite(`Value ${value} at index ${index}`, {
          fontsize: 90,
          textColor: "#fde68a",
        });
        floatLabel.position.set(hit.position.x, 20, 0);
        group.add(floatLabel);
        setTimeout(() => group.remove(floatLabel), 2000);

        // Show panel
        infoPanel.visible = true;
        setTimeout(() => (infoPanel.visible = false), 4000);

        // Debug HUD
        setDebugText(`📦 Value ${value} at index ${index}`);
        setTimeout(() => setDebugText(""), 1500);
      }
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // === Render loop ===
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // === Resize ===
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // === Cleanup ===
    return () => {
      window.removeEventListener("resize", onResize);
      renderer.setAnimationLoop(null);
      renderer.dispose();
      if (container.contains(renderer.domElement))
        container.removeChild(renderer.domElement);
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

// === Helper to make text ===
function makeTextSprite(message, parameters) {
  const fontface = parameters.fontface || "Arial";
  const fontsize = parameters.fontsize || 60;
  const textColor = parameters.textColor || "#ffffff";

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = `${fontsize}px ${fontface}`;
  const lines = message.split("\n");
  let maxWidth = 0;
  lines.forEach((line) => {
    const width = context.measureText(line).width;
    if (width > maxWidth) maxWidth = width;
  });

  canvas.width = maxWidth + 80;
  canvas.height = fontsize * lines.length * 1.5;

  context.font = `${fontsize}px ${fontface}`;
  context.fillStyle = textColor;
  context.textBaseline = "top";

  lines.forEach((line, i) => {
    context.fillText(line, 10, i * fontsize * 1.3);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  const scaleFactor = 0.02; // fixed consistent size
  sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);
  return sprite;
}

export default ARPage1;
