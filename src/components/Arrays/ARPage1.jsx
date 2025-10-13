import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ARPage1 = () => {
  const containerRef = useRef();
  const [debugText, setDebugText] = useState("");

  useEffect(() => {
    const container = containerRef.current;

    // === SCENE SETUP ===
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

    // === START AR SESSION ===
    if (navigator.xr) {
      navigator.xr
        .requestSession("immersive-ar", { requiredFeatures: ["local-floor"] })
        .then((session) => renderer.xr.setSession(session))
        .catch((err) => console.error("❌ AR session failed:", err));
    }

    // === LIGHTING ===
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(1, 3, 2);
    scene.add(dirLight);

    // === GROUP CONTAINER ===
    const group = new THREE.Group();
    group.position.set(0, 1, -2);
    group.scale.set(0.1, 0.1, 0.1);
    scene.add(group);

    // === DATA ===
    const data = [10, 20, 30, 40];
    const spacing = 8;
    const boxRefs = [];

    // === TITLE LABEL ===
    const title = makeTextSprite("Array Data Structure", {
      fontsize: 90,
      textColor: "#ffffff",
      fontface: "Arial",
    });
    title.position.set(0, 25, 0);
    group.add(title);

    // === BOXES + LABELS ===
    data.forEach((value, i) => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(6, 6, 6),
        new THREE.MeshStandardMaterial({
          color: i % 2 === 0 ? "#60a5fa" : "#34d399",
        })
      );
      box.position.set((i - (data.length - 1) / 2) * spacing, 3, 0);
      box.userData = { index: i, value };
      group.add(box);
      boxRefs.push(box);

      // Value label (above box)
      const valueLabel = makeTextSprite(`${value}`, {
        fontsize: 70,
        textColor: "#ffffff",
      });
      valueLabel.position.set(box.position.x, 9, 3);
      group.add(valueLabel);

      // Index label (below box)
      const indexLabel = makeTextSprite(`[${i}]`, {
        fontsize: 60,
        textColor: "#facc15",
      });
      indexLabel.position.set(box.position.x, -1, 3);
      group.add(indexLabel);
    });

    // === INFO PANEL (initially hidden) ===
    const panel = makeTextSprite(
      "📘 Understanding Index in Arrays:\n\n• Index starts at 0\n• Access is O(1) in arrays",
      { fontsize: 70, textColor: "#fde68a" }
    );
    panel.position.set(60, 5, 0);
    panel.visible = false;
    group.add(panel);

    // === RAYCASTER SETUP ===
    const raycaster = new THREE.Raycaster();
    const tapPos = new THREE.Vector2();

    const onSelect = (event) => {
      const session = renderer.xr.getSession();
      const viewerPose = event.frame.getViewerPose(
        renderer.xr.getReferenceSpace()
      );
      if (!viewerPose) return;

      const ray = event.inputSource.targetRaySpace;
      const pose = event.frame.getPose(ray, renderer.xr.getReferenceSpace());
      if (!pose) return;

      const origin = new THREE.Vector3().fromArray(pose.transform.position);
      const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(
        new THREE.Quaternion().fromArray(pose.transform.orientation)
      );

      raycaster.set(origin, direction);
      const intersects = raycaster.intersectObjects(boxRefs);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const { index, value } = hit.userData;

        // Visual feedback
        hit.material.color.set("#facc15");
        setTimeout(
          () => hit.material.color.set(index % 2 === 0 ? "#60a5fa" : "#34d399"),
          1000
        );

        // Debug text
        setDebugText(`📦 Value ${value} at index ${index}`);
        setTimeout(() => setDebugText(""), 2000);

        // Floating label
        const floatLabel = makeTextSprite(`Value ${value} at index ${index}`, {
          fontsize: 70,
          textColor: "#fde68a",
        });
        floatLabel.position.set(hit.position.x, 15, 0);
        group.add(floatLabel);
        setTimeout(() => group.remove(floatLabel), 2000);

        // Show info panel
        panel.visible = true;
        setTimeout(() => (panel.visible = false), 4000);
      }
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // === ANIMATION LOOP ===
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // === HANDLE RESIZE ===
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // === CLEANUP ===
    return () => {
      window.removeEventListener("resize", handleResize);
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

// === HELPER FUNCTION FOR TEXT SPRITES ===
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

  canvas.width = maxWidth + 50;
  canvas.height = fontsize * lines.length * 1.4;

  context.font = `${fontsize}px ${fontface}`;
  context.fillStyle = textColor;
  context.textBaseline = "top";

  lines.forEach((line, i) => {
    context.fillText(line, 10, i * fontsize * 1.4);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(spriteMaterial);
  const scaleFactor = 0.1;
  sprite.scale.set(canvas.width * scaleFactor, canvas.height * scaleFactor, 1);
  return sprite;
}

export default ARPage1;
