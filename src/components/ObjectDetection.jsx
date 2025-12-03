// ../components/ObjectDetection.jsx
import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text as DreiText } from "@react-three/drei";
import * as THREE from "three";

// ✅ CLASSES for "Array" mode
const ARRAY_CLASSES = ["laptop", "book", "chair", "bottle", "cell phone"];

// ✅ CLASSES usable as Linked List "nodes"
const LINKED_LIST_CLASSES = ["cup", "train"]; // 👈 add/remove classes here

const getLinkedListNodes = (predictions) =>
  predictions.filter(
    (p) => LINKED_LIST_CLASSES.includes(p.class) && p.score > 0.4
  );

/**
 * Simple heuristic to approximate front view using aspect ratio.
 */
const isFrontView = (pred) => {
  const [x, y, w, h] = pred.bbox;
  if (w <= 0 || h <= 0) return false;
  const aspect = w / h;

  switch (pred.class) {
    case "laptop":
      return aspect > 1.1 && aspect < 3.5;
    case "book":
    case "cell phone":
      return aspect > 0.35 && aspect < 1.8;
    case "bottle":
      return aspect > 0.3 && aspect < 0.9;
    case "chair":
      return aspect > 0.6 && aspect < 2.0;
    default:
      return true;
  }
};

/**
 * Side-view / queue candidate.
 */
const isSideViewQueueItem = (pred, frameWidth, frameHeight) => {
  const [x, y, w, h] = pred.bbox;
  if (w <= 0 || h <= 0) return false;

  const aspect = w / h; // width / height

  if (pred.class === "person") {
    if (!frameWidth || !frameHeight) return false;
    const minHeight = frameHeight * 0.45;
    const minWidth = frameWidth * 0.05;

    if (h < minHeight || w < minWidth) return false;

    return aspect < 0.6 && aspect > 0.2;
  }

  if (pred.class === "book" || pred.class === "cell phone") {
    if (h < 40 || w < 20) return false;
    return !isFrontView(pred);
  }

  return false;
};

/**
 * Unified array detection:
 * - ARRAY_CLASSES
 * - score > 0.4
 * - front view only
 * - sorted left→right
 */
const getArrayObjects = (predictions) => {
  return predictions
    .filter(
      (p) => ARRAY_CLASSES.includes(p.class) && p.score > 0.4 && isFrontView(p)
    )
    .sort((a, b) => a.bbox[0] - b.bbox[0]);
};

// --- OpenCV-based book stack detection ---
const detectBookStacksFromEdges = (videoEl) => {
  if (!window.cv || !videoEl.videoWidth || !videoEl.videoHeight) return [];

  const cv = window.cv;

  const capCanvas = document.createElement("canvas");
  capCanvas.width = videoEl.videoWidth;
  capCanvas.height = videoEl.videoHeight;
  const capCtx = capCanvas.getContext("2d");
  capCtx.drawImage(videoEl, 0, 0, capCanvas.width, capCanvas.height);

  const frame = cv.imread(capCanvas);
  const gray = new cv.Mat();
  const blur = new cv.Mat();
  const edges = new cv.Mat();
  const lines = new cv.Mat();

  try {
    cv.cvtColor(frame, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0);
    cv.Canny(blur, edges, 50, 150);

    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 80, 50, 10);

    const verticalLines = [];

    for (let i = 0; i < lines.rows; i++) {
      const x1 = lines.data32S[i * 4 + 0];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];

      const dx = Math.abs(x2 - x1);
      const dy = Math.abs(y2 - y1);

      if (dx < 15 && dy > 40) {
        const cx = (x1 + x2) / 2;
        const yTop = Math.min(y1, y2);
        const yBottom = Math.max(y1, y2);
        verticalLines.push({ x1, y1, x2, y2, x: cx, yTop, yBottom });
      }
    }

    if (verticalLines.length < 2) {
      return [];
    }

    verticalLines.sort((a, b) => a.x - b.x);

    const stacks = [];
    const distanceThreshold = 40;

    verticalLines.forEach((line) => {
      if (stacks.length === 0) {
        stacks.push([line]);
        return;
      }

      const lastStack = stacks[stacks.length - 1];
      const lastLine = lastStack[lastStack.length - 1];

      if (Math.abs(line.x - lastLine.x) <= distanceThreshold) {
        lastStack.push(line);
      } else {
        stacks.push([line]);
      }
    });

    stacks.forEach((stack) => {
      stack.sort((a, b) => a.yTop - b.yTop);
    });

    return stacks;
  } catch (e) {
    console.error("OpenCV stack detection error:", e);
    return [];
  } finally {
    frame.delete();
    gray.delete();
    blur.delete();
    edges.delete();
    lines.delete();
  }
};

// Helper to draw arrow (linked list)
const drawArrow = (ctx, x1, y1, x2, y2) => {
  const headLen = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
};

/* ========= AR HELPERS ========= */

// Start WebXR AR session (same style as VisualPageAR)
const startAR = (gl) => {
  if (navigator.xr) {
    navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
      if (supported) {
        navigator.xr
          .requestSession("immersive-ar", {
            requiredFeatures: ["hit-test", "local-floor"],
          })
          .then((session) => {
            gl.xr.setSession(session);
          })
          .catch((err) => console.error("AR session failed:", err));
      } else {
        console.warn("AR not supported on this device.");
      }
    });
  }
};

// Floating 3D label for the detected concept
const ConceptARLabel = ({ concept, detail }) => {
  const groupRef = useRef();
  const tRef = useRef(0);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    tRef.current += delta;
    // small floating animation
    const yBase = 1.5;
    groupRef.current.position.y = yBase + Math.sin(tRef.current * 1.5) * 0.1;

    // always face camera
    const cam = state.camera;
    groupRef.current.lookAt(cam.position);
  });

  const textDetail =
    detail ||
    (concept === "Array"
      ? "Array: items stored side by side in memory. Fast access with index (O(1))."
      : concept === "Queue (FIFO)"
      ? "Queue: First In, First Out. Imagine a line of people waiting (O(1) front/back)."
      : concept === "Stack (LIFO)"
      ? "Stack: Last In, First Out. Like a pile of books, you push and pop on top (O(1))."
      : concept === "Linked List"
      ? "Linked List: each node points to the next node. Good for inserts/removals (O(1) at node)."
      : "");

  return (
    <group ref={groupRef} position={[0, 1.5, -3]}>
      {/* Title */}
      <DreiText
        position={[0, 0.4, 0]}
        fontSize={0.35}
        color="#34D399"
        anchorX="center"
        anchorY="middle"
        maxWidth={4}
      >
        {concept}
      </DreiText>

      {/* Details */}
      <DreiText
        position={[0, -0.1, 0]}
        fontSize={0.18}
        color="#e5e7eb"
        anchorX="center"
        anchorY="top"
        maxWidth={3.2}
        textAlign="center"
      >
        {textDetail}
      </DreiText>
    </group>
  );
};

/* ========= MODE GUIDE (BEGINNER + LIGHT TECH) ========= */

const getGuideText = (mode) => {
  switch (mode) {
    case "Array":
      return [
        "📚 Array mode",
        "",
        "• Point the camera at 2 or more front-view objects.",
        "• Valid objects: laptop, book, chair, bottle, cell phone.",
        "• Place them in a row from left to right on a table.",
        "• We treat each object as an element with an index: a[0], a[1], a[2]...",
        "• Access by index is very fast: O(1) time.",
      ].join("\n");

    case "Stack":
      return [
        "📘 Stack mode",
        "",
        "• Point the camera at a vertical pile of 2 or more books.",
        "• The app looks for book spines forming a tall column.",
        "• Think of plates or books stacked on top of each other.",
        "• You only use the top: push() to add, pop() to remove.",
        "• Last In, First Out (LIFO).",
      ].join("\n");

    case "Queue":
      return [
        "👥 Queue mode",
        "",
        "• Point the camera at 2 or more side-view people, books, or phones.",
        "• They should form a horizontal line, like people lining up in a store.",
        "• The first item in front will be the first one to leave the queue.",
        "• Enqueue at the back, dequeue at the front.",
        "• First In, First Out (FIFO).",
      ].join("\n");

    case "Linked List":
      return [
        "☕ Linked List mode",
        "",
        "• Point the camera at 3 or more cups or toy trains in a row.",
        "• Place them side by side on a table with small gaps.",
        "• Each object represents a node that points to the next node.",
        "• You can insert or remove nodes without shifting the others.",
        "• Great for dynamic sequences: insert/delete near O(1) when you have the node.",
      ].join("\n");

    case "Auto":
      return [
        "✨ Auto mode",
        "",
        "The camera will try to recognize the structure for you:",
        "",
        "• Array → 2+ front-view laptops/books/chairs/bottles/phones in a row.",
        "• Stack → vertical stack of 2+ books (book spines on top of each other).",
        "• Queue → 2+ side-view people/books/phones lined up horizontally.",
        "• Linked List → 3+ cups or trains arranged like a chain.",
        "",
        "Move real objects and see how they map to data structures.",
      ].join("\n");

    default:
      return "";
  }
};

/* ========= MAIN COMPONENT ========= */

const ObjectDection = ({ selectedDSA = "none" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Loading model...");
  const [arrayCount, setArrayCount] = useState(0);
  const [bookCount, setBookCount] = useState(0);
  const [queueCount, setQueueCount] = useState(0);
  const [linkedListCount, setLinkedListCount] = useState(0);
  const [debugLabels, setDebugLabels] = useState([]);
  const [concept, setConcept] = useState("");
  const [conceptDetail, setConceptDetail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 ref for current DSA mode
  const selectedDSARef = useRef(selectedDSA);
  useEffect(() => {
    selectedDSARef.current = selectedDSA;
  }, [selectedDSA]);

  useEffect(() => {
    let model = null;
    let animationFrameId = null;
    let lastDetection = 0;
    const DETECT_INTERVAL = 200; // ms

    const start = async () => {
      try {
        setIsLoading(true);
        setStatus("Loading model...");

        const [tf, cocoSsd] = await Promise.all([
          import("@tensorflow/tfjs"),
          import("@tensorflow-models/coco-ssd"),
        ]);

        if (tf && tf.ready) {
          await tf.ready();
        }

        model = await cocoSsd.load();
        setStatus("Model loaded ✔️ – starting camera...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        videoRef.current.onloadeddata = () => {
          setStatus("Camera running...");
          setIsLoading(false);
          detectLoop();
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ Error loading camera or model.");
        setIsLoading(false);
      }
    };

    const analyzeScene = (predictions, stacks) => {
      const mode = selectedDSARef.current;

      if (!mode || mode === "none") {
        setConcept("");
        setConceptDetail("");
        return;
      }

      const video = videoRef.current;
      const frameWidth = video?.videoWidth || 0;
      const frameHeight = video?.videoHeight || 0;

      const linkedNodes = getLinkedListNodes(predictions);
      const books = predictions.filter(
        (p) => p.class === "book" && p.score > 0.4
      );

      const queueItems = predictions.filter(
        (p) =>
          (p.class === "person" ||
            p.class === "book" ||
            p.class === "cell phone") &&
          p.score > 0.4 &&
          isSideViewQueueItem(p, frameWidth, frameHeight)
      );

      const arrayLike = getArrayObjects(predictions);
      const arrayLikeCount = arrayLike.length;
      const bookCountLocal = books.length;
      const queueCountLocal = queueItems.length;
      const linkedListCountLocal = linkedNodes.length;

      const tryQueue = () => {
        if (queueCountLocal >= 2) {
          const ys = queueItems.map((p) => p.bbox[1]);
          const maxY = Math.max(...ys);
          const minY = Math.min(...ys);

          if (maxY - minY < 80) {
            setConcept("Queue (FIFO)");
            setConceptDetail(
              `Detected ${queueCountLocal} side-view item(s) (person/book/cell phone) in a line → behaves like a Queue (First In, First Out).`
            );
            return true;
          }
        }
        return false;
      };

      const tryStack = () => {
        if (bookCountLocal >= 1 && stacks && stacks.length >= 1) {
          const stackCount = stacks.length;
          setConcept("Stack (LIFO)");
          setConceptDetail(
            `Detected ${bookCountLocal} book(s) arranged into ${stackCount} stack(s) via vertical edges (spines) → behaves like a Stack (Last In, First Out).`
          );
          return true;
        }
        return false;
      };

      const tryLinkedList = () => {
        const nodeCount = linkedListCountLocal;
        if (nodeCount >= 3) {
          const nodesSorted = [...linkedNodes].sort(
            (a, b) => a.bbox[0] - b.bbox[0]
          );
          const ys = nodesSorted.map((c) => c.bbox[1]);
          const maxY = Math.max(...ys);
          const minY = Math.min(...ys);
          const yRange = maxY - minY;

          if (yRange < 80) {
            const usedClasses = Array.from(
              new Set(linkedNodes.map((n) => n.class))
            ).join(", ");
            setConcept("Linked List");
            setConceptDetail(
              `Detected ${nodeCount} node(s) (${usedClasses}) aligned in a row → can be modeled as a Singly Linked List (each node points to the next, last points to null).`
            );
            return true;
          }
        }
        return false;
      };

      const tryArray = () => {
        if (arrayLikeCount >= 2) {
          setConcept("Array");
          setConceptDetail(
            `Detected ${arrayLikeCount} front-view object(s) (laptop/book/chair/bottle/cell phone) → modeled as an Array (index-based, fixed positions).`
          );
          return true;
        }
        return false;
      };

      if (mode === "Auto") {
        if (tryQueue()) return;
        if (tryStack()) return;
        if (tryLinkedList()) return;
        if (tryArray()) return;
        setConcept("");
        setConceptDetail("");
        return;
      }

      if (mode === "Queue") {
        if (!tryQueue()) {
          setConcept("");
          setConceptDetail("");
        }
        return;
      }

      if (mode === "Stack") {
        if (!tryStack()) {
          setConcept("");
          setConceptDetail("");
        }
        return;
      }

      if (mode === "Linked List") {
        if (!tryLinkedList()) {
          setConcept("");
          setConceptDetail("");
        }
        return;
      }

      if (mode === "Array") {
        if (!tryArray()) {
          setConcept("");
          setConceptDetail("");
        }
        return;
      }

      setConcept("");
      setConceptDetail("");
    };

    const draw = (predictions, stacks) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mode = selectedDSARef.current;
      const frameWidth = canvas.width;
      const frameHeight = canvas.height;

      // ARRAY OBJECTS
      const arrayObjects = getArrayObjects(predictions);
      setArrayCount(arrayObjects.length);

      // No boxes if only 1 array object
      if (arrayObjects.length > 1 && (mode === "Auto" || mode === "Array")) {
        arrayObjects.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;

          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);

          const label = `index[${index}] ${p.class}`;
          const labelHeight = 26;
          const labelPaddingX = 8;

          const textWidth = ctx.measureText(label).width;
          const bgWidth = Math.max(textWidth + labelPaddingX * 2, width);

          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x, y + height, bgWidth, labelHeight);

          ctx.fillStyle = "#00ff00";
          ctx.font = "16px Arial";
          ctx.fillText(label, x + labelPaddingX, y + height + 18);
        });
      }

      // QUEUE
      const queueItems = predictions.filter(
        (p) =>
          (p.class === "person" ||
            p.class === "book" ||
            p.class === "cell phone") &&
          p.score > 0.4 &&
          isSideViewQueueItem(p, frameWidth, frameHeight)
      );
      setQueueCount(queueItems.length);

      // No boxes if only 1 queue item
      if (queueItems.length > 1 && (mode === "Auto" || mode === "Queue")) {
        const queueSorted = [...queueItems].sort(
          (a, b) => a.bbox[0] - b.bbox[0]
        );

        queueSorted.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;

          ctx.strokeStyle = "#e5e7eb";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          const label = `Q[${index}] ${p.class}`;
          const labelHeight = 22;

          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
          ctx.fillRect(x, y - labelHeight, width * 0.9, labelHeight);

          ctx.fillStyle = "#f9fafb";
          ctx.font = "14px Arial";
          ctx.fillText(label, x + 4, y - 6);
        });
      }

      // LINKED LIST
      const linkedNodes = getLinkedListNodes(predictions);
      setLinkedListCount(linkedNodes.length);

      // No boxes if only 1 node
      if (
        linkedNodes.length > 1 &&
        (mode === "Auto" || mode === "Linked List")
      ) {
        const nodesSorted = [...linkedNodes].sort(
          (a, b) => a.bbox[0] - b.bbox[0]
        );

        ctx.lineWidth = 2;

        nodesSorted.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;
          const cx = x + width / 2;
          const cy = y + height / 2;

          ctx.strokeStyle = "#facc15";
          ctx.strokeRect(x, y, width, height);

          const label = `node[${index}] ${p.class}`;
          const labelHeight = 20;
          ctx.fillStyle = "#facc15";
          ctx.fillRect(x, y - labelHeight, width, labelHeight);

          ctx.fillStyle = "#0f172a";
          ctx.font = "14px Arial";
          ctx.fillText(label, x + 4, y - 4);

          if (index < nodesSorted.length - 1) {
            const next = nodesSorted[index + 1];
            const [nx, ny, nWidth, nHeight] = next.bbox;
            const nCx = nx + nWidth / 2;
            const nCy = ny + nHeight / 2;

            ctx.strokeStyle = "#facc15";
            ctx.fillStyle = "#facc15";
            drawArrow(ctx, cx + width / 2, cy, nCx - nWidth / 2, nCy);
          } else {
            ctx.fillStyle = "#facc15";
            ctx.font = "14px Arial";
            ctx.fillText("null", cx + width / 2 + 10, cy + 4);
          }
        });
      }

      // STACK
      const books = predictions.filter(
        (p) => p.class === "book" && p.score > 0.4
      );
      setBookCount(books.length);

      let validStacks = [];
      if (stacks && stacks.length > 0) {
        validStacks = stacks.filter((stack) => stack.length >= 2);
      }

      if (validStacks.length > 0 && (mode === "Auto" || mode === "Stack")) {
        const stackColors = ["#f97316", "#3b82f6", "#ec4899", "#22c55e"];

        validStacks.forEach((stack, sIdx) => {
          const color = stackColors[sIdx % stackColors.length];

          stack.forEach((line) => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.stroke();
          });

          const avgX =
            stack.reduce((sum, l) => sum + l.x, 0) / Math.max(stack.length, 1);
          const topY = Math.min(...stack.map((l) => l.yTop));

          ctx.fillStyle = color;
          ctx.font = "16px Arial";
          ctx.fillText(
            `Stack ${sIdx + 1} (${stack.length} book/s)`,
            avgX - 50,
            Math.max(20, topY - 10)
          );
        });
      }
    };

    const detectLoop = async () => {
      const now = performance.now();
      if (now - lastDetection >= DETECT_INTERVAL) {
        lastDetection = now;

        if (model && videoRef.current) {
          try {
            const predictions = await model.detect(videoRef.current);

            setDebugLabels(
              predictions.map(
                (p) => `${p.class} (${Math.round(p.score * 100)}%)`
              )
            );

            const video = videoRef.current;
            const frameWidth = video?.videoWidth || 0;
            const frameHeight = video?.videoHeight || 0;

            const books = predictions.filter(
              (p) => p.class === "book" && p.score > 0.4
            );
            const linkedNodes = getLinkedListNodes(predictions);

            const queueItems = predictions.filter(
              (p) =>
                (p.class === "person" ||
                  p.class === "book" ||
                  p.class === "cell phone") &&
                p.score > 0.4 &&
                isSideViewQueueItem(p, frameWidth, frameHeight)
            );

            setBookCount(books.length);
            setQueueCount(queueItems.length);
            setLinkedListCount(linkedNodes.length);

            let stacks = [];
            if (books.length > 0 && window.cv) {
              stacks = detectBookStacksFromEdges(videoRef.current);
            }

            draw(predictions, stacks);
            analyzeScene(predictions, stacks);
          } catch (err) {
            console.error("Detection error:", err);
          }
        }
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    start();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  const guideText = !concept ? getGuideText(selectedDSA) : "";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
        background: "black",
      }}
    >
      {/* CAMERA */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* 2D CANVAS OVERLAY (bounding boxes) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* STATUS PILL */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          padding: "6px 10px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.8)",
          color: "#e5e7eb",
          fontSize: "0.7rem",
          maxWidth: "100%",
          zIndex: 10,
        }}
      >
        DSA Concept Detection · {status}
      </div>

      {/* ⭐ AR CANVAS – 3D text floating in the environment when concept is detected */}
      {concept && (
        <Canvas
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
          camera={{ position: [0, 0, 3], fov: 50 }}
          onCreated={({ gl }) => {
            gl.xr.enabled = true;
            startAR(gl);
          }}
        >
          <ambientLight intensity={0.7} />
          <directionalLight position={[2, 3, 4]} intensity={0.7} />
          <ConceptARLabel concept={concept} detail={conceptDetail} />
          {/* disabled controls; only for debug in non-AR */}
          <OrbitControls enabled={false} />
        </Canvas>
      )}

      {/* 🔹 MODE GUIDE – Only when NO concept yet */}
      {guideText && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            maxWidth: "55%",
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(148, 163, 184, 0.9)",
            color: "#e5e7eb",
            fontSize: "0.75rem",
            lineHeight: 1.3,
            whiteSpace: "pre-wrap",
            zIndex: 12,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: "0.78rem",
              marginBottom: 4,
              color: "#facc15",
            }}
          >
            How to use this mode
          </div>
          {guideText}
        </div>
      )}

      {/* 🔥 LOADING OVERLAY */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            color: "#e5e7eb",
            fontSize: "0.9rem",
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "999px",
              border: "3px solid rgba(156,163,175,0.6)",
              borderTopColor: "#34D399",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <div>Preparing AR scanner...</div>
          <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
            {status} <br />
            Please allow camera permission.
          </div>

          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default ObjectDection;
