import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import gsap from "gsap";

const WeeksArray = () => {
  const mountRef = useRef(null);
  const boxes = useRef([]);
  const placeholders = useRef([]);
  const sceneRef = useRef(null);
  const spacing = 2;
  const totalSlots = 6;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "append", "insert", "delete", "swap"
  const [inputValues, setInputValues] = useState({
    value: "",
    index1: "",
    index2: "",
  });
  const [isPortrait, setIsPortrait] = useState(
    window.innerHeight > window.innerWidth
  );

  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isPortrait) return; // Do not render Three.js if portrait

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(
      mountRef.current.clientWidth,
      mountRef.current.clientHeight
    );
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 50;

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(0, 10, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // placeholders
    for (let i = 0; i < totalSlots; i++) {
      const placeholder = createEmptyBox();
      placeholder.position.x = i * spacing;
      scene.add(placeholder);
      placeholders.current.push(placeholder);

      const indexLabel = createTextLabel(i);
      indexLabel.position.set(i * spacing, -1.2, 0);
      scene.add(indexLabel);
    }

    let values = [1, 3, 5];
    values.forEach((val, i) => {
      const box = createBox(val);
      box.position.x = i * spacing;
      scene.add(box);
      boxes.current.push(box);
    });

    let reqId;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material))
            child.material.forEach((m) => m.dispose());
          else child.material.dispose();
          if (child.material.map) child.material.map.dispose();
        }
      });
      renderer.dispose();
      if (mountRef.current && renderer.domElement)
        mountRef.current.removeChild(renderer.domElement);
    };
  }, [isPortrait]);

  if (isPortrait) {
    return (
      <div className="flex justify-center items-center h-screen text-center p-5 text-xl">
        Rotate your mobile device to landscape to view the visualizer.
      </div>
    );
  }

  const createBox = (value) => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const mesh = new THREE.Mesh(geometry, material);

    const texture = createTextTexture(value);
    const textMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), textMaterial);
    plane.position.z = 0.51;
    mesh.add(plane);
    return mesh;
  };

  const createEmptyBox = () => {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xaaaaaa,
      opacity: 0.3,
      transparent: true,
    });
    return new THREE.Mesh(geometry, material);
  };

  const createTextLabel = (value) => {
    const texture = createTextTexture(value, "white", "transparent", 80);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), material);
  };

  const createTextTexture = (
    text,
    color = "black",
    bg = "white",
    fontSize = 100
  ) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 256;
    canvas.height = 256;
    context.fillStyle = bg;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `${fontSize}px Arial`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    return new THREE.CanvasTexture(canvas);
  };

  // ---- Array Operations ----
  const appendValue = (value) => {
    const scene = sceneRef.current;
    if (boxes.current.length >= totalSlots) return;
    const box = createBox(value);
    const newIndex = boxes.current.length;
    box.position.x = newIndex * spacing + 5;
    scene.add(box);
    boxes.current.push(box);
    gsap.to(box.position, { x: newIndex * spacing, duration: 1 });
  };

  const insertValue = (index, value) => {
    const scene = sceneRef.current;
    if (boxes.current.length >= totalSlots) return;
    if (index < 0 || index > boxes.current.length) return;

    for (let i = index; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, { x: (i + 1) * spacing, duration: 1 });
    }
    const box = createBox(value);
    box.position.x = index * spacing - 5;
    scene.add(box);
    boxes.current.splice(index, 0, box);
    gsap.to(box.position, { x: index * spacing, duration: 1 });
  };

  const removeValue = (index) => {
    const scene = sceneRef.current;
    if (index < 0 || index >= boxes.current.length) return;

    const removedBox = boxes.current[index];
    gsap.to(removedBox.position, {
      y: -3,
      duration: 1,
      onComplete: () => {
        scene.remove(removedBox);
        removedBox.geometry.dispose();
        if (Array.isArray(removedBox.material))
          removedBox.material.forEach((m) => m.dispose());
        else removedBox.material.dispose();
      },
    });

    for (let i = index + 1; i < boxes.current.length; i++) {
      gsap.to(boxes.current[i].position, { x: (i - 1) * spacing, duration: 1 });
    }
    boxes.current.splice(index, 1);
  };

  const swapValues = (index1, index2) => {
    if (
      index1 < 0 ||
      index1 >= boxes.current.length ||
      index2 < 0 ||
      index2 >= boxes.current.length
    )
      return;
    const box1 = boxes.current[index1];
    const box2 = boxes.current[index2];
    const tempPos1 = box1.position.x;
    const tempPos2 = box2.position.x;
    gsap.to(box1.position, { x: tempPos2, duration: 1 });
    gsap.to(box2.position, { x: tempPos1, duration: 1 });
    [boxes.current[index1], boxes.current[index2]] = [
      boxes.current[index2],
      boxes.current[index1],
    ];
  };

  // ---- Modal Handlers ----
  const handleDone = () => {
    if (modalType === "append" && inputValues.value !== "")
      appendValue(Number(inputValues.value));
    else if (
      modalType === "insert" &&
      inputValues.value !== "" &&
      inputValues.index1 !== ""
    )
      insertValue(Number(inputValues.index1), Number(inputValues.value));
    else if (modalType === "delete" && inputValues.index1 !== "")
      removeValue(Number(inputValues.index1));
    else if (
      modalType === "swap" &&
      inputValues.index1 !== "" &&
      inputValues.index2 !== ""
    )
      swapValues(Number(inputValues.index1), Number(inputValues.index2));

    setInputValues({ value: "", index1: "", index2: "" });
    setModalOpen(false);
  };

  return (
    <div className="w-full h-screen relative">
      {/* Buttons */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 flex flex-row gap-3">
        {["append", "insert", "delete", "swap"].map((type) => (
          <button
            key={type}
            onClick={() => {
              setModalType(type);
              setModalOpen(true);
            }}
            className="
            px-4 py-2 rounded-lg border 
            bg-transparent 
            text-gray-800 border-gray-800 
            hover:bg-gray-100 
            dark:text-white dark:border-white dark:hover:bg-white/10 
            transition font-medium
          "
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Three.js Mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Modal */}
      {modalOpen && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
              {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </h3>

            {(modalType === "append" || modalType === "insert") && (
              <div className="mb-3">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium mb-1">
                  <span className="text-blue-600 font-mono text-lg font-bold">
                    v=
                  </span>
                  <span>Value</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter value"
                  value={inputValues.value}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, value: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            {(modalType === "insert" ||
              modalType === "delete" ||
              modalType === "swap") && (
              <div className="mb-3">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium mb-1">
                  <span className="text-green-600 font-mono text-lg font-bold">
                    i=
                  </span>
                  <span>Index</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter index"
                  value={inputValues.index1}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, index1: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            {modalType === "swap" && (
              <div className="mb-3">
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-200 font-medium mb-1">
                  <span className="text-purple-600 font-mono text-lg font-bold">
                    i=
                  </span>
                  <span>Index</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter index"
                  value={inputValues.index2}
                  onChange={(e) =>
                    setInputValues({ ...inputValues, index2: e.target.value })
                  }
                  className="w-full px-3 py-2 border-2 border-purple-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeksArray;
