import React, { useRef, useEffect, useState } from "react";

// --- OpenCV-based book stack detection (unchanged) ---
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

    cv.HoughLinesP(
      edges,
      lines,
      1,
      Math.PI / 180,
      80, // threshold
      50, // minLineLength
      10 // maxLineGap
    );

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

const ObjectDection = () => {
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

  // 🔥 NEW: loading flag for overlay
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 NEW: DSA selection mode
  // "none" = off, "Auto" = old behavior, others = forced structure
  const [selectedDSA, setSelectedDSA] = useState("none");
  const selectedDSARef = useRef("none");

  // keep ref in sync with state (para hindi ma-reset yung camera effect)
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
          setIsLoading(false); // ✅ camera + model ready
          detectLoop();
        };
      } catch (err) {
        console.error(err);
        setStatus("❌ Error loading camera or model.");
        setIsLoading(false);
      }
    };

    // 🔥 UPDATED: scene analysis now respects selectedDSARef
    const analyzeScene = (predictions, stacks) => {
      const mode = selectedDSARef.current; // "none" | "Auto" | "Array" | "Stack" | "Queue" | "Linked List"

      // ➜ Huwag mag-detect ng DSA kung wala pang napipili
      if (!mode || mode === "none") {
        setConcept("");
        setConceptDetail("");
        return;
      }

      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );
      const bottles = predictions.filter(
        (p) => p.class === "bottle" && p.score > 0.4
      );
      const books = predictions.filter(
        (p) => p.class === "book" && p.score > 0.4
      );
      const persons = predictions.filter(
        (p) => p.class === "person" && p.score > 0.4
      );
      const cups = predictions.filter(
        (p) => p.class === "cup" && p.score > 0.4
      );

      const bookCountLocal = books.length;
      const queueCountLocal = persons.length;
      const cupCountLocal = cups.length;
      const arrayLikeCount = phones.length + bottles.length;

      // Small helpers para hindi ulit-ulit
      const tryQueue = () => {
        if (queueCountLocal >= 2) {
          const ys = persons.map((p) => p.bbox[1]);
          const maxY = Math.max(...ys);
          const minY = Math.min(...ys);
          if (maxY - minY < 80) {
            setConcept("Queue (FIFO)");
            setConceptDetail(
              `Detected ${queueCountLocal} person(s) in a horizontal line → behaves like a Queue (First In, First Out).`
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
        if (cupCountLocal >= 3) {
          const cupsSorted = [...cups].sort((a, b) => a.bbox[0] - b.bbox[0]);
          const ys = cupsSorted.map((c) => c.bbox[1]);
          const maxY = Math.max(...ys);
          const minY = Math.min(...ys);
          const yRange = maxY - minY;

          if (yRange < 80) {
            setConcept("Linked List");
            setConceptDetail(
              `Detected ${cupCountLocal} cup node(s) aligned in a row → can be modeled as a Singly Linked List (each node points to the next, last points to null).`
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
            `Detected ${arrayLikeCount} similar objects (cellphones/bottles) → can be modeled as an Array (index-based, fixed positions).`
          );
          return true;
        }
        return false;
      };

      // --- Mode logic ---
      if (mode === "Auto") {
        // old behavior, priority: Queue → Stack → Linked List → Array
        if (tryQueue()) return;
        if (tryStack()) return;
        if (tryLinkedList()) return;
        if (tryArray()) return;
        setConcept("");
        setConceptDetail("");
        return;
      }

      // Explicit modes – dapat match yung pattern, else clear
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

      // fallback
      setConcept("");
      setConceptDetail("");
    };

    // 🔥 UPDATED: drawing also respects selectedDSARef
    const draw = (predictions, stacks) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      // Match canvas to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mode = selectedDSARef.current;

      // Phones → array
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );
      setArrayCount(phones.length);

      if (mode === "Auto" || mode === "Array") {
        phones.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;

          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);

          const label = `index[${index}]`;
          const labelHeight = 26;

          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x, y + height, width, labelHeight);

          ctx.fillStyle = "#00ff00";
          ctx.font = "18px Arial";
          ctx.fillText(label, x + 5, y + height + 18);
        });
      }

      // Queue (persons)
      const persons = predictions.filter(
        (p) => p.class === "person" && p.score > 0.4
      );
      setQueueCount(persons.length);

      if (persons.length > 0 && (mode === "Auto" || mode === "Queue")) {
        const personsSorted = [...persons].sort(
          (a, b) => a.bbox[0] - b.bbox[0]
        );

        personsSorted.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;

          ctx.strokeStyle = "#e5e7eb";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          const label = `Q[${index}]`;
          const labelHeight = 22;

          ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
          ctx.fillRect(x, y - labelHeight, width * 0.6, labelHeight);

          ctx.fillStyle = "#f9fafb";
          ctx.font = "14px Arial";
          ctx.fillText(label, x + 4, y - 6);
        });
      }

      // Linked list (cups)
      const cups = predictions.filter(
        (p) => p.class === "cup" && p.score > 0.4
      );
      setLinkedListCount(cups.length);

      if (cups.length >= 1 && (mode === "Auto" || mode === "Linked List")) {
        const cupsSorted = [...cups].sort((a, b) => a.bbox[0] - b.bbox[0]);

        ctx.lineWidth = 2;

        cupsSorted.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;
          const cx = x + width / 2;
          const cy = y + height / 2;

          ctx.strokeStyle = "#facc15";
          ctx.strokeRect(x, y, width, height);

          const label = `node[${index}]`;
          const labelHeight = 20;
          ctx.fillStyle = "#facc15";
          ctx.fillRect(x, y - labelHeight, width, labelHeight);

          ctx.fillStyle = "#0f172a";
          ctx.font = "14px Arial";
          ctx.fillText(label, x + 4, y - 4);

          if (index < cupsSorted.length - 1) {
            const next = cupsSorted[index + 1];
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

      // Book stacks (OpenCV)
      if (stacks && stacks.length > 0 && (mode === "Auto" || mode === "Stack")) {
        const stackColors = ["#f97316", "#3b82f6", "#ec4899", "#22c55e"];

        stacks.forEach((stack, sIdx) => {
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

            const books = predictions.filter(
              (p) => p.class === "book" && p.score > 0.4
            );
            const persons = predictions.filter(
              (p) => p.class === "person" && p.score > 0.4
            );
            const cups = predictions.filter(
              (p) => p.class === "cup" && p.score > 0.4
            );
            setBookCount(books.length);
            setQueueCount(persons.length);
            setLinkedListCount(cups.length);

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

  const dsaModes = [
    { value: "none", label: "Off" },
    { value: "Auto", label: "Auto" },
    { value: "Array", label: "Array" },
    { value: "Stack", label: "Stack" },
    { value: "Queue", label: "Queue" },
    { value: "Linked List", label: "Linked List" },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%", // 🔑 susunod sa parent container
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

      {/* CANVAS OVERLAY */}
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
          maxWidth: "30%",
        }}
      >
        DSA Concept Detection · {status}
      </div>

      {/* 🔥 NEW: DSA MODE SELECTOR */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          padding: "6px 8px",
          borderRadius: 999,
          background: "rgba(15, 23, 42, 0.9)",
          color: "#e5e7eb",
          fontSize: "0.7rem",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ opacity: 0.8 }}>Mode:</span>
        {dsaModes.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelectedDSA(m.value)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 999,
              fontSize: "0.7rem",
              background:
                selectedDSA === m.value
                  ? "rgba(52, 211, 153, 0.9)"
                  : "rgba(15, 23, 42, 0.9)",
              color: selectedDSA === m.value ? "#0f172a" : "#e5e7eb",
              borderColor:
                selectedDSA === m.value
                  ? "rgba(52, 211, 153, 1)"
                  : "rgba(75, 85, 99, 1)",
              borderWidth: 1,
              borderStyle: "solid",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* DATA STRUCTURE OVERLAY – only when may concept */}
      {concept && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            maxWidth: "90%",
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(15, 23, 42, 0.8)",
            border: "1px solid rgba(148, 163, 184, 0.8)",
            color: "#f9fafb",
            fontSize: "0.85rem",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              fontSize: "0.95rem",
              marginBottom: 4,
              fontWeight: 600,
            }}
          >
            🧠 Detected Data Structure:{" "}
            <span style={{ color: "#34D399" }}>{concept}</span>
          </div>
          <div>{conceptDetail}</div>
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
          }}
        >
          {/* simple loader circle */}
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

          {/* inline keyframes for the spinner */}
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
