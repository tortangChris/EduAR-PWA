"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import {
  createTextSprite,
  create3DTextBox,
  applyItemAnimation,
  clearGroup,
} from "../../pages/simulations/Simulationhelpers";

// ==================== BOOK ====================
function createBook(
  label,
  color,
  isHighlighted,
  isOpen = false,
  openAmount = 0,
) {
  const book = new THREE.Group();
  const bookWidth = 0.55,
    bookHeight = 0.07,
    bookDepth = 0.38;
  const vintageColors = {
    "#3498db": { cover: "#4a3728", spine: "#3d2e22" },
    "#2ecc71": { cover: "#2d4a3e", spine: "#243d32" },
    "#e67e22": { cover: "#6b3a2a", spine: "#5a3024" },
    "#9b59b6": { cover: "#3d2845", spine: "#2e1e35" },
    "#e74c3c": { cover: "#5c2a2a", spine: "#4a2222" },
  };
  const vintage = vintageColors[color] || {
    cover: "#4a3728",
    spine: "#3d2e22",
  };
  const coverMat = new THREE.MeshStandardMaterial({
    color: vintage.cover,
    roughness: 0.75,
    metalness: 0.0,
    emissive: isHighlighted && !isOpen ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted && !isOpen ? 0.2 : 0,
  });
  const spineMat = new THREE.MeshStandardMaterial({
    color: vintage.spine,
    roughness: 0.7,
  });
  const pageMat = new THREE.MeshStandardMaterial({
    color: "#e8dcc8",
    roughness: 0.95,
  });
  const backCover = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth, 0.012, bookDepth),
    coverMat,
  );
  backCover.position.y = -bookHeight / 2 + 0.006;
  book.add(backCover);
  const pagesBlock = new THREE.Mesh(
    new THREE.BoxGeometry(
      bookWidth - 0.024,
      bookHeight - 0.028,
      bookDepth - 0.024,
    ),
    pageMat,
  );
  pagesBlock.position.set(0.012 / 2, 0, 0);
  book.add(pagesBlock);
  const spine = new THREE.Mesh(
    new THREE.BoxGeometry(0.035, bookHeight + 0.014, bookDepth + 0.008),
    spineMat,
  );
  spine.position.x = -bookWidth / 2 - 0.017;
  book.add(spine);
  const frontCoverGroup = new THREE.Group();
  frontCoverGroup.position.set(-bookWidth / 2, bookHeight / 2 - 0.006, 0);
  const frontCover = new THREE.Mesh(
    new THREE.BoxGeometry(bookWidth, 0.012, bookDepth),
    coverMat,
  );
  frontCover.position.set(bookWidth / 2, 0, 0);
  frontCoverGroup.add(frontCover);
  const coverCanvas = document.createElement("canvas");
  coverCanvas.width = 256;
  coverCanvas.height = 64;
  const cctx = coverCanvas.getContext("2d");
  cctx.fillStyle = "#b8860b";
  cctx.font = "bold 36px Georgia";
  cctx.textAlign = "center";
  cctx.fillText(label.toUpperCase(), 128, 46);
  const coverTitle = new THREE.Mesh(
    new THREE.PlaneGeometry(bookWidth * 0.8, 0.045),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(coverCanvas),
      transparent: true,
    }),
  );
  coverTitle.rotation.x = -Math.PI / 2;
  coverTitle.position.set(bookWidth / 2, 0.008, -bookDepth * 0.08);
  frontCoverGroup.add(coverTitle);
  if (isOpen && openAmount > 0) {
    const easedOpen =
      openAmount < 0.5
        ? 2 * openAmount * openAmount
        : 1 - Math.pow(-2 * openAmount + 2, 2) / 2;
    frontCoverGroup.rotation.z = easedOpen * Math.PI * 0.55;
  }
  book.add(frontCoverGroup);
  const ribbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.12, 0.003),
    new THREE.MeshStandardMaterial({ color: "#6b3a3a", roughness: 0.7 }),
  );
  ribbon.position.set(0.06, 0.01, bookDepth / 2 + 0.002);
  book.add(ribbon);
  if (isHighlighted && !isOpen) {
    book.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(
          bookWidth + 0.05,
          bookHeight + 0.02,
          bookDepth + 0.04,
        ),
        new THREE.MeshBasicMaterial({
          color: "#ffff00",
          transparent: true,
          opacity: 0.12,
        }),
      ),
    );
  }
  return book;
}

// ==================== CARDBOARD BOX ====================
function createCardboardBox(label, color, isHighlighted, openAmount = 0) {
  const box = new THREE.Group();
  const boxW = 0.48,
    boxH = 0.34,
    boxD = 0.38,
    wallThickness = 0.015,
    flapThickness = 0.012;
  const cardboardMat = new THREE.MeshStandardMaterial({
    color: "#c4a060",
    roughness: 0.9,
    emissive: isHighlighted ? "#ffff00" : "#000",
    emissiveIntensity: isHighlighted ? 0.2 : 0,
  });
  const flapMat = new THREE.MeshStandardMaterial({
    color: "#c4a060",
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, wallThickness, boxD),
    cardboardMat,
  );
  bottom.position.y = wallThickness / 2;
  box.add(bottom);
  const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, wallThickness),
    cardboardMat,
  );
  frontWall.position.set(
    0,
    wallThickness + boxH / 2,
    boxD / 2 - wallThickness / 2,
  );
  box.add(frontWall);
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(boxW, boxH, wallThickness),
    cardboardMat,
  );
  backWall.position.set(
    0,
    wallThickness + boxH / 2,
    -boxD / 2 + wallThickness / 2,
  );
  box.add(backWall);
  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, boxH, boxD - wallThickness * 2),
    cardboardMat,
  );
  leftWall.position.set(
    -boxW / 2 + wallThickness / 2,
    wallThickness + boxH / 2,
    0,
  );
  box.add(leftWall);
  const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, boxH, boxD - wallThickness * 2),
    cardboardMat,
  );
  rightWall.position.set(
    boxW / 2 - wallThickness / 2,
    wallThickness + boxH / 2,
    0,
  );
  box.add(rightWall);
  const topY = wallThickness + boxH;
  const easedOpen =
    openAmount < 0.5
      ? 2 * openAmount * openAmount
      : 1 - Math.pow(-2 * openAmount + 2, 2) / 2;
  const flapAngle =
    easedOpen <= 0.5
      ? easedOpen * 2 * (Math.PI / 2)
      : Math.PI / 2 + (easedOpen - 0.5) * 2 * (Math.PI / 4);
  const flapWidth = (boxW - wallThickness * 2) / 2;
  const flapDepth = boxD - wallThickness * 2;
  const leftFlapPivot = new THREE.Group();
  leftFlapPivot.position.set(-boxW / 2 + wallThickness, topY, 0);
  const leftFlap = new THREE.Mesh(
    new THREE.BoxGeometry(flapWidth, flapThickness, flapDepth),
    flapMat,
  );
  leftFlap.position.set(flapWidth / 2, 0, 0);
  leftFlapPivot.add(leftFlap);
  leftFlapPivot.rotation.z = flapAngle;
  box.add(leftFlapPivot);
  const rightFlapPivot = new THREE.Group();
  rightFlapPivot.position.set(boxW / 2 - wallThickness, topY, 0);
  const rightFlap = new THREE.Mesh(
    new THREE.BoxGeometry(flapWidth, flapThickness, flapDepth),
    flapMat,
  );
  rightFlap.position.set(-flapWidth / 2, 0, 0);
  rightFlapPivot.add(rightFlap);
  rightFlapPivot.rotation.z = -flapAngle;
  box.add(rightFlapPivot);
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 160;
  labelCanvas.height = 100;
  const lctx = labelCanvas.getContext("2d");
  lctx.fillStyle = "#ffffff";
  lctx.fillRect(0, 0, 160, 100);
  lctx.strokeStyle = "#333";
  lctx.lineWidth = 2;
  lctx.strokeRect(2, 2, 156, 96);
  lctx.fillStyle = "#333";
  lctx.font = "bold 22px Arial";
  lctx.textAlign = "center";
  lctx.fillText(label, 80, 60);
  const labelMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(0.18, 0.11),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(labelCanvas) }),
  );
  labelMesh.position.set(0, wallThickness + boxH / 2, boxD / 2 + 0.001);
  box.add(labelMesh);
  if (isHighlighted && openAmount < 0.1) {
    box.add(
      new THREE.Mesh(
        new THREE.BoxGeometry(boxW + 0.04, boxH + 0.1, boxD + 0.04),
        new THREE.MeshBasicMaterial({
          color: "#ffff00",
          transparent: true,
          opacity: 0.12,
        }),
      ),
    );
  }
  return box;
}

// ==================== BUILD STACK SCENE ====================
function buildStackScene(
  group,
  data,
  highlightIndex,
  environment,
  animPhase,
  animData,
  animProgress,
  tutorialText,
) {
  clearGroup(group);
  if (tutorialText || animPhase) highlightIndex = null;
  const groundY = 0;

  if (tutorialText) {
    group.add(
      create3DTextBox(
        tutorialText.title,
        tutorialText.description,
        tutorialText.step,
        new THREE.Vector3(0, 1.8, 0),
      ),
    );
  }

  if (environment === "books") {
    const stackSpacing = 0.11,
      baseY = (-data.length * stackSpacing) / 2;
    data.forEach((item, i) => {
      const isHl = highlightIndex === i,
        isTop = i === data.length - 1;
      const isPeeking = isTop && animPhase === "stack-peek-open";
      const openAmount = isPeeking ? animProgress || 0 : 0;
      const book = createBook(
        item.label,
        item.color,
        isHl,
        isPeeking,
        openAmount,
      );
      book.position.set(
        isHl && !isPeeking ? 0.18 : 0,
        baseY + i * stackSpacing,
        0,
      );
      book.rotation.y = i % 2 === 0 ? 0 : 0.04;
      applyItemAnimation(
        book,
        i,
        animPhase || "",
        animData || {},
        "stack",
        animProgress,
      );
      group.add(book);
      if (isTop) {
        const topSprite = createTextSprite("← TOP", "#ff0000", 22);
        topSprite.position.set(0.65, baseY + i * stackSpacing, 0);
        topSprite.scale.set(0.38, 0.14, 1);
        group.add(topSprite);
      }
    });
    const desk = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.035, 0.65),
      new THREE.MeshStandardMaterial({ color: "#5d4037", roughness: 0.7 }),
    );
    desk.position.y = (-data.length * stackSpacing) / 2 - 0.08;
    group.add(desk);
  } else if (environment === "plates") {
    const plateThickness = 0.02,
      plateRadius = 0.18,
      plateGap = 0.003,
      baseY = groundY - 0.1;
    const standMat = new THREE.MeshStandardMaterial({
      color: "#555555",
      metalness: 0.6,
      roughness: 0.4,
    });
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.28, 0.04, 32),
      standMat,
    );
    base.position.y = baseY;
    group.add(base);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.1, 16),
      standMat,
    );
    pole.position.y = baseY + 0.07;
    group.add(pole);
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.05, 0.8),
      new THREE.MeshStandardMaterial({
        color: "#7f8c8d",
        metalness: 0.3,
        roughness: 0.5,
      }),
    );
    counter.position.y = baseY - 0.05;
    group.add(counter);
    data.forEach((item, i) => {
      const isHl = highlightIndex === i,
        isTop = i === data.length - 1;
      const plateY = baseY + 0.14 + i * (plateThickness + plateGap);
      const plateGroup = new THREE.Group();
      const plateMat = new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.2,
        metalness: 0.05,
        emissive: isHl ? "#ffff00" : "#000",
        emissiveIntensity: isHl ? 0.3 : 0,
      });
      plateGroup.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            plateRadius,
            plateRadius - 0.01,
            plateThickness,
            32,
          ),
          plateMat,
        ),
      );
      let animY = 0,
        animScale = 1;
      if (isTop && animPhase === "stack-pop-lift")
        animY = 0.15 * (animProgress || 0);
      else if (isTop && animPhase === "stack-pop-fly") {
        const p = animProgress || 0;
        animY = 0.15 + 0.4 * p;
        animScale = Math.max(0.01, 1 - p);
        plateGroup.rotation.z = p * 2;
      } else if (isTop && animPhase === "stack-peek-lift")
        animY = 0.1 * (animProgress || 0);
      else if (isTop && animPhase === "stack-push-drop") {
        animY = 0.35 * (1 - (animProgress || 0));
        animScale = 0.7 + 0.3 * (animProgress || 0);
      } else if (isTop && animPhase === "stack-push-settle")
        animY = 0.05 * (1 - (animProgress || 0));
      plateGroup.position.y = plateY + animY;
      plateGroup.scale.setScalar(animScale);
      if (isHl && animPhase !== "stack-pop-fly") {
        plateGroup.add(
          new THREE.Mesh(
            new THREE.CylinderGeometry(
              plateRadius + 0.02,
              plateRadius + 0.02,
              plateThickness + 0.01,
              32,
            ),
            new THREE.MeshBasicMaterial({
              color: "#ffff00",
              transparent: true,
              opacity: 0.2,
            }),
          ),
        );
      }
      group.add(plateGroup);
      if (isTop) {
        const topSprite = createTextSprite("← TOP", "#ff0000", 20);
        topSprite.position.set(
          0.4,
          baseY + 0.14 + (data.length - 1) * (plateThickness + plateGap) + 0.06,
          0,
        );
        topSprite.scale.set(0.3, 0.1, 1);
        group.add(topSprite);
      }
    });
  } else if (environment === "boxes") {
    const boxSpacing = 0.36;
    data.forEach((item, i) => {
      const isHl = highlightIndex === i,
        isTop = i === data.length - 1;
      let openAmount = 0;
      if (isTop && animPhase === "stack-peek-open")
        openAmount = animProgress || 0;
      else if (isTop && animPhase === "stack-peek-settle")
        openAmount = 1 - (animProgress || 0);
      const cardboardBox = createCardboardBox(
        item.label,
        item.color,
        isHl,
        openAmount,
      );
      cardboardBox.position.set(0, groundY + i * boxSpacing, 0);
      cardboardBox.rotation.y = i % 2 === 0 ? 0 : 0.03;
      cardboardBox.scale.setScalar(0.78);
      applyItemAnimation(
        cardboardBox,
        i,
        animPhase || "",
        animData || {},
        "stack",
        animProgress,
      );
      group.add(cardboardBox);
      if (isTop) {
        const topSprite = createTextSprite("← TOP", "#ff0000", 22);
        topSprite.position.set(0.55, groundY + i * boxSpacing + 0.15, 0);
        topSprite.scale.set(0.32, 0.11, 1);
        group.add(topSprite);
      }
    });
    const pallet = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.055, 0.6),
      new THREE.MeshStandardMaterial({ color: "#a0522d", roughness: 0.9 }),
    );
    pallet.position.y = groundY - 0.03;
    group.add(pallet);
  }
}

// ==================== STACK SIMULATION WITH WEBXR ====================
export default function StackSimulation({ onProgress }) {
  const [environment, setEnvironment] = useState("books");
  const [highlightIndex, setHighlightIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPhase, setAnimPhase] = useState("");
  const [animData, setAnimData] = useState({});
  const [animProgress, setAnimProgress] = useState(1);
  const [tutorialActive, setTutorialActive] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepAnimating, setStepAnimating] = useState(false);
  const [tutorialText, setTutorialText] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [tutorialCompletedOnce, setTutorialCompletedOnce] = useState(false); // ✅ NEW

  const [webxrSupported, setWebxrSupported] = useState(false);
  const [webxrActive, setWebxrActive] = useState(false);
  const [webxrPlaced, setWebxrPlaced] = useState(false);

  const xrSessionRef = useRef(null);
  const xrRendererRef = useRef(null);
  const xrSceneRef = useRef(null);
  const xrCameraRef = useRef(null);
  const xrGroupRef = useRef(null);
  const xrReticleRef = useRef(null);
  const xrHitTestSourceRef = useRef(null);
  const xrContainerRef = useRef(null);
  const animFrameRef = useRef(null);

  const [trainCars, setTrainCars] = useState([
    { id: 1, label: "Engine", color: "#e74c3c" },
    { id: 2, label: "Coal", color: "#34495e" },
    { id: 3, label: "Cargo", color: "#2ecc71" },
    { id: 4, label: "Pass", color: "#9b59b6" },
  ]);
  const [peopleLine, setPeopleLine] = useState([
    {
      id: 1,
      label: "Alice",
      color: "#e74c3c",
      appearance: {
        skinTone: "#f5c6a0",
        shirtColor: "#e74c3c",
        pantsColor: "#2c3e50",
        hairColor: "#2c1810",
        hairStyle: "long",
        gender: "female",
      },
    },
    {
      id: 2,
      label: "Bob",
      color: "#3498db",
      appearance: {
        skinTone: "#8d5524",
        shirtColor: "#3498db",
        pantsColor: "#2c3e50",
        hairColor: "#1a1a1a",
        hairStyle: "short",
        gender: "male",
      },
    },
    {
      id: 3,
      label: "Carol",
      color: "#2ecc71",
      appearance: {
        skinTone: "#c68642",
        shirtColor: "#2ecc71",
        pantsColor: "#1a1a2e",
        hairColor: "#3d2314",
        hairStyle: "long",
        gender: "female",
      },
    },
  ]);
  const [dominoNodes, setDominoNodes] = useState([
    { id: 1, label: "1", color: "#ecf0f1" },
    { id: 2, label: "2", color: "#ecf0f1" },
    { id: 3, label: "3", color: "#ecf0f1" },
    { id: 4, label: "4", color: "#ecf0f1" },
  ]);

  const getData = () =>
    environment === "train"
      ? trainCars
      : environment === "people"
        ? peopleLine
        : dominoNodes;

  useEffect(() => {
    const checkXR = async () => {
      try {
        if (navigator.xr) {
          const s = await navigator.xr.isSessionSupported("immersive-ar");
          setWebxrSupported(s);
        }
      } catch {}
    };
    checkXR();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!webxrPlaced || !xrGroupRef.current) return;
    buildLinkedListScene(
      xrGroupRef.current,
      getData(),
      highlightIndex,
      environment,
      animPhase,
      animData,
      animProgress,
      tutorialText,
    );
  }, [
    webxrPlaced,
    trainCars,
    peopleLine,
    dominoNodes,
    highlightIndex,
    environment,
    animPhase,
    animData,
    animProgress,
    tutorialText,
  ]);

  useEffect(() => {
    if (xrGroupRef.current && webxrActive && webxrPlaced)
      xrGroupRef.current.scale.setScalar(0.3 * zoomLevel);
  }, [zoomLevel, webxrActive, webxrPlaced]);

  const cleanupWebXR = useCallback(() => {
    if (xrRendererRef.current) {
      xrRendererRef.current.setAnimationLoop(null);
      xrRendererRef.current.dispose();
      if (
        xrContainerRef.current &&
        xrRendererRef.current.domElement.parentNode === xrContainerRef.current
      )
        xrContainerRef.current.removeChild(xrRendererRef.current.domElement);
    }
    xrSessionRef.current = null;
    xrRendererRef.current = null;
    xrSceneRef.current = null;
    xrCameraRef.current = null;
    xrGroupRef.current = null;
    xrReticleRef.current = null;
    xrHitTestSourceRef.current = null;
    setWebxrActive(false);
    setWebxrPlaced(false);
  }, []);

  const stopWebXR = useCallback(() => {
    if (xrSessionRef.current) {
      try {
        xrSessionRef.current.end();
      } catch {
        cleanupWebXR();
      }
    } else cleanupWebXR();
  }, [cleanupWebXR]);
  const resetWebXRPlacement = useCallback(() => {
    if (xrGroupRef.current) xrGroupRef.current.visible = false;
    if (xrReticleRef.current) xrReticleRef.current.visible = true;
    setWebxrPlaced(false);
  }, []);

  const startWebXR = async () => {
    const xr = navigator.xr;
    if (!xr) {
      alert("WebXR not available.");
      return;
    }
    try {
      const sessionInit = {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
      };
      const overlayEl = document.getElementById("ar-overlay-linkedlist");
      if (overlayEl) sessionInit.domOverlay = { root: overlayEl };
      const session = await xr.requestSession("immersive-ar", sessionInit);
      xrSessionRef.current = session;
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local");
      xrRendererRef.current = renderer;
      if (xrContainerRef.current)
        xrContainerRef.current.appendChild(renderer.domElement);
      await renderer.xr.setSession(session);
      const scene = new THREE.Scene();
      xrSceneRef.current = scene;
      scene.add(new THREE.AmbientLight(0xffffff, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(1, 3, 2);
      scene.add(dirLight);
      const camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        100,
      );
      xrCameraRef.current = camera;
      const group = new THREE.Group();
      group.visible = false;
      scene.add(group);
      xrGroupRef.current = group;
      const reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
      );
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);
      xrReticleRef.current = reticle;
      const viewerSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({
        space: viewerSpace,
      });
      xrHitTestSourceRef.current = hitTestSource;
      session.addEventListener("select", () => {
        if (
          xrReticleRef.current?.visible &&
          xrGroupRef.current &&
          !xrGroupRef.current.visible
        ) {
          xrGroupRef.current.position.setFromMatrixPosition(
            xrReticleRef.current.matrix,
          );
          xrGroupRef.current.visible = true;
          xrGroupRef.current.scale.setScalar(0.3 * zoomLevel);
          xrReticleRef.current.visible = false;
          setWebxrPlaced(true);
          buildLinkedListScene(
            xrGroupRef.current,
            getData(),
            null,
            environment,
            "",
            {},
            1,
            null,
          );
        }
      });
      session.addEventListener("end", () => cleanupWebXR());
      renderer.setAnimationLoop((_ts, frame) => {
        if (
          frame &&
          xrHitTestSourceRef.current &&
          xrGroupRef.current &&
          !xrGroupRef.current.visible
        ) {
          const refSpace = renderer.xr.getReferenceSpace();
          if (refSpace) {
            const results = frame.getHitTestResults(xrHitTestSourceRef.current);
            if (results.length > 0) {
              const pose = results[0].getPose(refSpace);
              if (pose && xrReticleRef.current) {
                xrReticleRef.current.visible = true;
                xrReticleRef.current.matrix.fromArray(pose.transform.matrix);
              }
            } else if (xrReticleRef.current)
              xrReticleRef.current.visible = false;
          }
        }
        renderer.render(scene, camera);
      });
      setWebxrActive(true);
      setWebxrPlaced(false);
    } catch (err) {
      console.error(err);
      alert("WebXR failed: " + err.message);
    }
  };

  const smoothAnimate = (duration, phase, data) =>
    new Promise((resolve) => {
      const startTime = Date.now();
      setAnimPhase(phase);
      setAnimData(data);
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimProgress(progress);
        if (progress < 1) animFrameRef.current = requestAnimationFrame(animate);
        else resolve();
      };
      animFrameRef.current = requestAnimationFrame(animate);
    });

  const runTutorialStep = async (step, stepIdx, allSteps) => {
    setStepAnimating(true);
    setTutorialText({
      title: step.title,
      description: step.description,
      step: `${stepIdx + 1}/${allSteps.length}`,
    });
    setHighlightIndex(step.highlightIndex ?? null);
    if (step.animPhase && step.animDuration)
      await smoothAnimate(step.animDuration, step.animPhase, {
        index: step.highlightIndex,
      });
    else {
      setAnimPhase("");
      setAnimData({});
      setAnimProgress(1);
    }
    if (step.action) step.action();
    setStepAnimating(false);
  };

  const nextStep = async () => {
    if (stepAnimating) return;
    if (currentStepIndex < tutorialSteps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      await runTutorialStep(tutorialSteps[nextIdx], nextIdx, tutorialSteps);
    } else completeTutorial(); // ✅ Done button
  };

  // ✅ Skip — walang progress
  const skipTutorial = () => {
    setTutorialActive(false);
    setTutorialSteps([]);
    setCurrentStepIndex(0);
    setTutorialText(null);
    setHighlightIndex(null);
    setAnimPhase("");
    setAnimData({});
    setIsAnimating(false);
  };

  // ✅ Complete — may progress
  const completeTutorial = () => {
    setTutorialActive(false);
    setTutorialSteps([]);
    setCurrentStepIndex(0);
    setTutorialText(null);
    setHighlightIndex(null);
    setAnimPhase("");
    setAnimData({});
    setIsAnimating(false);
    setTutorialCompletedOnce(true);
    onProgress?.();
  };

  const startTutorial = (steps) => {
    if (isAnimating || tutorialActive) return;
    setIsAnimating(true);
    setTutorialActive(true);
    setTutorialSteps(steps);
    setCurrentStepIndex(0);
    runTutorialStep(steps[0], 0, steps);
  };

  const stackPushTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive || data.length >= 5) return;
    const labels =
      environment === "books"
        ? ["Physics", "English", "Art"]
        : environment === "plates"
          ? [`Plate ${data.length + 1}`]
          : [`Box ${String.fromCharCode(65 + data.length)}`];
    const colors = ["#9b59b6", "#e74c3c", "#1abc9c", "#3498db"];
    const newItem = {
      id: Date.now(),
      label: labels[Math.floor(Math.random() * labels.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    startTutorial([
      {
        title: "⬆️ Stack PUSH",
        description: `Pushing "${newItem.label}" onto stack.\n\nAlways adds to TOP! (LIFO)`,
      },
      {
        title: "📍 Find TOP",
        description: `top = ${data.length - 1}\nnew position = ${data.length}`,
        action: () => setData((prev) => [...prev, newItem]),
      },
      {
        title: "📦 Place on TOP",
        description: `stack[${data.length}] = "${newItem.label}"`,
        highlightIndex: data.length,
        animPhase: "stack-push-drop",
        animDuration: 600,
      },
      {
        title: "✅ Pushed!",
        description: "Done! Time: O(1)",
        highlightIndex: data.length,
        animPhase: "stack-push-settle",
        animDuration: 400,
      },
    ]);
  };

  const stackPopTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive) return;
    if (data.length === 0) {
      startTutorial([
        {
          title: "⚠️ Stack Underflow!",
          description: "Stack is EMPTY!\n\nCannot pop.\nPush elements first!",
        },
      ]);
      return;
    }
    const topItem = data[data.length - 1];
    startTutorial([
      {
        title: "⬇️ Stack POP",
        description: "Removing TOP element.\n\nOnly TOP can be removed!",
        highlightIndex: data.length - 1,
      },
      {
        title: "🎯 Identify TOP",
        description: `top = "${topItem.label}"`,
        highlightIndex: data.length - 1,
        animPhase: "stack-pop-lift",
        animDuration: 500,
      },
      {
        title: "📤 Remove",
        description: "Removing...",
        highlightIndex: data.length - 1,
        animPhase: "stack-pop-fly",
        animDuration: 600,
        action: () => setData((prev) => prev.slice(0, -1)),
      },
      {
        title: "✅ Popped!",
        description: "Done! Time: O(1)\nLIFO: Last In, First Out",
      },
    ]);
  };

  const stackPeekTutorial = () => {
    const data = getData();
    if (isAnimating || tutorialActive) return;
    if (data.length === 0) {
      startTutorial([
        { title: "⚠️ Stack Empty!", description: "Nothing to peek!" },
      ]);
      return;
    }
    const topItem = data[data.length - 1];
    startTutorial([
      {
        title: "👁️ Stack PEEK",
        description: "Look at TOP without removing.",
        highlightIndex: data.length - 1,
      },
      {
        title: "🔍 Viewing TOP",
        description: `TOP = "${topItem.label}"\n\nStack unchanged!`,
        highlightIndex: data.length - 1,
        animPhase: "stack-peek-lift",
        animDuration: 600,
      },
      {
        title: "📖 Opening...",
        description: `Examining "${topItem.label}"...`,
        highlightIndex: data.length - 1,
        animPhase: "stack-peek-open",
        animDuration: 1200,
      },
      {
        title: "✅ Done!",
        description: "Peek = O(1)\nElement stays in place.",
        animPhase: "stack-peek-settle",
        animDuration: 500,
      },
    ]);
  };

  const data = getData();

  return (
    <div
      id="ar-overlay-stack"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        overflow: "hidden",
      }}
    >
      <div
        ref={xrContainerRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: webxrActive ? 1 : -1,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          background: "rgba(0,0,0,0.8)",
          padding: 4,
          borderRadius: 25,
          zIndex: 10,
        }}
      >
        {[
          { id: "books", icon: "📚", label: "Books" },
          { id: "plates", icon: "🍽️", label: "Plates" },
          { id: "boxes", icon: "📦", label: "Boxes" },
        ].map((e) => (
          <button
            key={e.id}
            onClick={() => !isAnimating && setEnvironment(e.id)}
            style={{
              padding: "6px 12px",
              fontSize: 11,
              fontWeight: "bold",
              border: "none",
              borderRadius: 20,
              background: environment === e.id ? "#10b981" : "transparent",
              color: "white",
              opacity: environment === e.id ? 1 : 0.6,
              cursor: "pointer",
            }}
          >
            {e.icon} {e.label}
          </button>
        ))}
      </div>

      {webxrActive && (
        <button
          onClick={() => {
            stopWebXR();
            window.location.href = "/modules/Stack/1";
          }}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: "12px 20px",
            background: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: 20,
            fontSize: 14,
            fontWeight: "bold",
            zIndex: 300,
            cursor: "pointer",
          }}
        >
          ✕ Exit AR
        </button>
      )}

      {webxrPlaced && !tutorialActive && (
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 200,
          }}
        >
          <button
            onPointerDown={() => setZoomLevel((p) => Math.min(p + 0.25, 3))}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "3px solid #fff",
              background: "#667eea",
              color: "white",
              fontSize: 28,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            +
          </button>
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#000",
              border: "3px solid #0f0",
              color: "#0f0",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onPointerDown={() => setZoomLevel((p) => Math.max(p - 0.25, 0.3))}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "3px solid #fff",
              background: "#f5576c",
              color: "white",
              fontSize: 32,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            −
          </button>
          <button
            onPointerDown={() => setZoomLevel(1.0)}
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              border: "3px solid #fff",
              background: "#4facfe",
              color: "white",
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            ⟲
          </button>
        </div>
      )}

      {webxrPlaced && (
        <div
          style={{
            position: "absolute",
            top: 48,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
          }}
        >
          <button
            onClick={resetWebXRPlacement}
            style={{
              padding: "8px 20px",
              fontSize: 12,
              fontWeight: "bold",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20,
              background: "rgba(255,255,255,0.1)",
              color: "white",
              cursor: "pointer",
            }}
          >
            📍 Reposition AR
          </button>
        </div>
      )}

      {tutorialActive && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(0,0,0,0.7)",
            padding: "10px 20px",
            borderRadius: 30,
            border: "1px solid rgba(255,255,255,0.2)",
            zIndex: 200,
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontWeight: "bold",
              minWidth: 50,
            }}
          >
            {currentStepIndex + 1}/{tutorialSteps.length}
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    i <= currentStepIndex ? "#667eea" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
          <button
            onClick={skipTutorial}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 20,
              color: "white",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Skip
          </button>
          <button
            onClick={nextStep}
            disabled={stepAnimating}
            style={{
              padding: "10px 24px",
              background: stepAnimating
                ? "#555"
                : "linear-gradient(135deg,#667eea,#764ba2)",
              border: "none",
              borderRadius: 20,
              color: "white",
              fontSize: 14,
              fontWeight: "bold",
              cursor: stepAnimating ? "not-allowed" : "pointer",
              opacity: stepAnimating ? 0.7 : 1,
            }}
          >
            {stepAnimating
              ? "⏳"
              : currentStepIndex >= tutorialSteps.length - 1
                ? "✓ Done"
                : "Next →"}
          </button>
        </div>
      )}

      {!tutorialActive && (webxrPlaced || !webxrActive) && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 10px 30px",
            background: "linear-gradient(to top,rgba(0,0,0,0.95),transparent)",
            zIndex: 100,
          }}
        >
          {tutorialCompletedOnce && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <button
                onClick={() => onFinish?.()}
                style={{
                  padding: "12px 28px",
                  fontSize: 13,
                  fontWeight: "bold",
                  border: "2px solid #10b981",
                  borderRadius: 25,
                  background: "rgba(16,185,129,0.2)",
                  color: "#10b981",
                  cursor: "pointer",
                }}
              >
                ✅ Finish & Continue
              </button>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                label: "⬆️ Push",
                color: "#2ecc71",
                disabled: isAnimating || data.length >= 5,
                onClick: stackPushTutorial,
              },
              {
                label: "⬇️ Pop",
                color: "#e74c3c",
                disabled: isAnimating,
                onClick: stackPopTutorial,
              },
              {
                label: "👁️ Peek",
                color: "#f39c12",
                disabled: isAnimating,
                onClick: stackPeekTutorial,
              },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                disabled={btn.disabled}
                style={{
                  padding: "12px 16px",
                  fontSize: 12,
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: 25,
                  background: btn.disabled ? "#555" : btn.color,
                  color: "white",
                  opacity: btn.disabled ? 0.5 : 1,
                  cursor: btn.disabled ? "not-allowed" : "pointer",
                  minWidth: 70,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div
            style={{
              textAlign: "center",
              marginTop: 10,
              color: "rgba(255,255,255,0.7)",
              fontSize: 12,
            }}
          >
            Size: {data.length}
          </div>
        </div>
      )}

      {!webxrActive && webxrSupported && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "40px 50px",
            borderRadius: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 60 }}>📚</div>
          <h2 style={{ marginTop: 15 }}>Stack AR</h2>
          <p style={{ opacity: 0.7, marginTop: 10 }}>
            Visualize stacks in augmented reality
          </p>
          <button
            onClick={startWebXR}
            style={{
              marginTop: 25,
              padding: "15px 40px",
              background: "linear-gradient(135deg,#667eea,#764ba2)",
              border: "none",
              borderRadius: 30,
              color: "white",
              fontSize: 18,
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            🌐 Start AR
          </button>
        </div>
      )}
      {!webxrActive && !webxrSupported && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            padding: "40px 50px",
            borderRadius: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 60 }}>📷</div>
          <h2 style={{ marginTop: 15 }}>Camera Access Needed</h2>
          <p style={{ opacity: 0.7 }}>
            WebXR AR not supported on this device/browser.
          </p>
        </div>
      )}
    </div>
  );
}
