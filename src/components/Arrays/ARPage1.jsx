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
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    hemiLight.position.set(0.5, 1, 0.25);
    scene.add(hemiLight);

    // === MAIN GROUP ===
    const group = new THREE.Group();
    group.position.set(0, 1, -2);
    group.scale.set(0.1, 0.1, 0.1); // consistent with working cube
    scene.add(group);

    // === DATA ===
    const data = [10, 20, 30, 40];
    const spacing = 10;
    const boxRefs = [];

    // === TITLE ===
    const title = makeTextSprite("Array Data Structure", {
      fontsize: 90,
      textColor: "#ffffff",
    });
    title.position.set(0, 28, 0);
    group.add(title);

    // === BOXES ===
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

      // Value label (above)
      const valueLabel = makeTextSprite(`${value}`, {
        fontsize: 70,
        textColor: "#ffffff",
      });
      valueLabel.position.set(box.position.x, 10, 3);
      group.add(valueLabel);

      // Index label (below)
      const indexLabel = makeTextSprite(`[${i}]`, {
        fontsize: 60,
        textColor: "#facc15",
      });
      indexLabel.position.set(box.position.x, -1, 3);
      group.add(indexLabel);
    });

    // === PANEL TEXT (HIDDEN INITIALLY) ===
    const infoPanel = makeTextSprite(
      "📘 Understanding Index in Arrays:\n• Index starts at 0\n• Arrays store values contiguously",
      { fontsize: 70, textColor: "#fde68a" }
    );
    infoPanel.position.set(60, 8, 0);
    infoPanel.visible = false;
    group.add(infoPanel);

    // === RAYCASTER LOGIC (controller tap) ===
    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();

    const onSelect = (event) => {
      const controller = event.target;
      tempMatrix.identity().extractRotation(controller.matrixWorld);

      raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
      raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

      const intersects = raycaster.intersectObjects(boxRefs);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const { index, value } = hit.userData;

        // highlight
        hit.material.color.set("#facc15");
        setTimeout(
          () => hit.material.color.set(index % 2 === 0 ? "#60a5fa" : "#34d399"),
          1000
        );

        // debug text on screen
        setDebugText(`📦 Value ${value} at index ${index}`);
        setTimeout(() => setDebugText(""), 2000);

        // floating label above clicked box
        const label = makeTextSprite(`Value ${value} at index ${index}`, {
          fontsize: 70,
          textColor: "#fde68a",
        });
        label.position.copy(hit.position);
        label.position.y += 15;
        group.add(label);
        setTimeout(() => group.remove(label), 2000);

        // show info panel briefly
        infoPanel.visible = true;
        setTimeout(() => (infoPanel.visible = false), 4000);
      }
    };

    const controller = renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    scene.add(controller);

    // === ANIMATION LOOP ===
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    // === RESIZE HANDLER ===
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

// === HELPER: TEXT SPRITE ===
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
