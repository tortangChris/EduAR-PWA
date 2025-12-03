// ../components/ObjectDetection.jsx
import React, { useRef, useEffect, useState } from "react";

// ✅ CLASSES for "Array" mode
const ARRAY_CLASSES = ["laptop", "book", "chair", "bottle", "cell phone"];

// ✅ CLASSES usable as Linked List "nodes"
const LINKED_LIST_CLASSES = ["cup", "train"]; // 👈 add/remove classes here

const getLinkedListNodes = (predictions) =>
  predictions.filter(
    (p) => LINKED_LIST_CLASSES.includes(p.class) && p.score > 0.4
  );

/**
 * Simple heuristic para i-approx kung front view yung object.
 */
const isFrontView = (pred) => {
  const [x, , w, h] = pred.bbox;
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
 * Side-view / naka-pila candidate para sa Queue
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
 * Unified array detection
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

/* ========= GUIDE TEXT (CENTERED BEFORE DETECTION) ========= */

const getGuideText = (mode) => {
  switch (mode) {
    case "Array":
      return {
        title: "Array mode",
        lines: [
          "Visual: A row of boxes on a table.",
          "",
          "Setup:",
          "• Place at least 2 front-facing objects in a straight line.",
          "• Supported objects: laptop, book, chair, bottle, phone.",
          "",
          "How it works:",
          "• The camera scans from left to right.",
          "• Each position is mapped to an index: 0, 1, 2, 3...",
        ],
      };

    case "Stack":
      return {
        title: "Stack mode",
        lines: [
          "Visual: A pile of books on top of each other.",
          "",
          "Setup:",
          "• Stack at least 2 books vertically (spines visible).",
          "• Place them like a column on a shelf or table.",
          "",
          "How it works:",
          "• The top book is the last pushed and the first popped.",
          "• The camera detects this pile as a Stack (Last In, First Out).",
        ],
      };

    case "Queue":
      return {
        title: "Queue mode",
        lines: [
          "Visual: People waiting in a line.",
          "",
          "Setup:",
          "• Use at least 2 side-view people, books, or phones.",
          "• Arrange them in a horizontal line (left to right).",
          "• The first in the line should be at the front.",
          "",
          "How it works:",
          "• The first object in the line is the first one out.",
          "• The camera detects this as a Queue (First In, First Out).",
        ],
      };

    case "Linked List":
      return {
        title: "Linked List mode",
        lines: [
          "Visual: A chain of small objects.",
          "",
          "Setup:",
          "• Use at least 3 cups or toy trains.",
          "• Place them side by side in one row on a table.",
          "• Leave a small gap between each object.",
          "",
          "How it works:",
          "• Each object acts like a node that points to the next one.",
          "• The camera reads them as a Linked List in order.",
        ],
      };

    case "Auto":
      return {
        title: "Auto mode",
        lines: [
          "Let the app decide the best data structure.",
          "",
          "What it can detect:",
          "• Array → 2+ front-view laptops/books/chairs/bottles/phones in a row.",
          "• Stack → 2+ books stacked vertically.",
          "• Queue → 2+ side-view people/books/phones in a line.",
          "• Linked List → 3+ cups or toy trains in a row.",
          "",
          "Tips:",
          "• Move the camera slowly.",
          "• Make sure the objects are clearly visible and not blocked.",
        ],
      };

    default:
      return null;
  }
};

/* ========= LESSON OVERLAY (EXPLANATION + TASKS) ========= */

const normalizeConcept = (concept) => {
  if (!concept) return null;
  if (concept.startsWith("Array")) return "Array";
  if (concept.startsWith("Queue")) return "Queue";
  if (concept.startsWith("Stack")) return "Stack";
  if (concept.startsWith("Linked")) return "Linked List";
  return concept;
};

const LessonOverlay = ({
  lessonStep,
  concept,
  targetIndex,
  taskMessage,
  onNextStep,
}) => {
  if (!lessonStep || !concept) return null;

  const mode = normalizeConcept(concept);

  let title = "";
  let bodyLines = [];
  let showNextButton = true;
  let nextLabel = "Next ▶";

  // ==== ARRAY LESSONS ====
  if (mode === "Array") {
    if (lessonStep === "array_intro") {
      title = "How does an Array work?";
      bodyLines = [
        "• Each detected object becomes one slot in the array.",
        "• The label index[0], index[1], index[2]... is its position.",
        "• When code uses arr[k], it jumps directly to that position.",
        "",
        "In algorithms, this is why array access by index runs in O(1) time.",
      ];
      nextLabel = "Start AR Task";
    } else if (lessonStep === "array_task_1") {
      title = "AR Task: Access by Index";
      bodyLines = [
        `• Find the object labeled index[${targetIndex ?? 0}].`,
        "• Physically move that object closer to the camera.",
        "• The system will check if you really focused on the correct index.",
        "",
        "This simulates executing arr[" + (targetIndex ?? 0) + "] in code.",
      ];
      showNextButton = false; // auto-advance via detection
    } else if (lessonStep === "array_task_1_done") {
      title = "Array Task Result";
      bodyLines = [
        taskMessage ||
          "✅ You focused on the correct index. This models how arr[k] directly accesses a fixed position.",
        "",
        "Key idea:",
        "• Arrays store elements in contiguous memory.",
        "• Given index k, the address is base + k * size.",
        "• That gives O(1) time access by index in the RAM model.",
      ];
      nextLabel = "Close";
    }
  }

  // ==== QUEUE LESSONS ====
  if (mode === "Queue") {
    if (lessonStep === "queue_intro") {
      title = "How does a Queue work?";
      bodyLines = [
        "• A queue is like people waiting in line.",
        "• There is a FRONT (first to be served) and a BACK (last in line).",
        "• New elements go to the back (enqueue).",
        "• The front element leaves first (dequeue).",
        "",
        "This behavior is called FIFO: First In, First Out.",
      ];
      nextLabel = "Start AR Task";
    } else if (lessonStep === "queue_task_1") {
      title = "AR Task: Dequeue the Front";
      bodyLines = [
        "• Look at the detected line of people/objects.",
        "• The one labeled Q[0] is at the front of the queue.",
        "• Move that front object closer to the camera to simulate serving it.",
        "",
        "The system will check if the front element is the one closest to you.",
      ];
      showNextButton = false;
    } else if (lessonStep === "queue_task_1_done") {
      title = "Queue Task Result";
      bodyLines = [
        taskMessage ||
          "✅ You moved the front element. That is what dequeue(Q) does in a queue.",
        "",
        "In algorithms:",
        "• enqueue(Q, x) inserts x at the back.",
        "• dequeue(Q) removes the front element.",
        "• Many real-world systems (ticket lines, print jobs) use queues.",
      ];
      nextLabel = "Close";
    }
  }

  // ==== STACK LESSONS ====
  if (mode === "Stack") {
    if (lessonStep === "stack_intro") {
      title = "How does a Stack work?";
      bodyLines = [
        "• A stack is like a pile of books.",
        "• You add items on top (push).",
        "• You remove items from the top (pop).",
        "",
        "This behavior is called LIFO: Last In, First Out.",
      ];
      nextLabel = "Start AR Task";
    } else if (lessonStep === "stack_task_1") {
      title = "AR Task: Push onto the Stack";
      bodyLines = [
        "• Create a vertical pile of books in front of the camera.",
        "• Now place one more book on top of the existing stack.",
        "",
        "The system will detect if the number of book(s) in the scene increased.",
      ];
      showNextButton = false;
    } else if (lessonStep === "stack_task_1_done") {
      title = "Stack Task Result";
      bodyLines = [
        taskMessage ||
          "✅ You added a new book to the pile. That is a push operation on the stack.",
        "",
        "In algorithms:",
        "• push(S, x) puts x on top.",
        "• pop(S) removes the top element.",
        "• Function calls, undo/redo, and browser history use stacks.",
      ];
      nextLabel = "Close";
    }
  }

  // ==== LINKED LIST LESSONS ====
  if (mode === "Linked List") {
    if (lessonStep === "linked_intro") {
      title = "How does a Linked List work?";
      bodyLines = [
        "• A linked list is a chain of nodes.",
        "• Each node stores data and a pointer to the next node.",
        "• The last node points to null (end of the list).",
        "",
        "Unlike arrays, linked lists do not require contiguous memory.",
      ];
      nextLabel = "Start AR Task";
    } else if (lessonStep === "linked_task_1") {
      title = "AR Task: Append a Node";
      bodyLines = [
        "• Place 3 or more cups/toy trains in one row (your nodes).",
        "• Now append one more node at the right end of the chain.",
        "",
        "The system will detect if the number of nodes increased while staying in one row.",
      ];
      showNextButton = false;
    } else if (lessonStep === "linked_task_1_done") {
      title = "Linked List Task Result";
      bodyLines = [
        taskMessage ||
          "✅ You appended a new node at the tail. This is how insert-at-end works in a singly linked list.",
        "",
        "Key ideas:",
        "• Each node has a next pointer.",
        "• To append, we find the last node and set its next to the new node.",
        "• Traversal is O(n), but insertion at head/tail can be O(1) with proper pointers.",
      ];
      nextLabel = "Close";
    }
  }

  if (!title) return null;

  return (
    <div
      style={{
        position: "absolute",
        right: 16,
        bottom: 18,
        width: "min(340px, 80%)",
        padding: "10px 12px",
        borderRadius: 12,
        background: "rgba(15, 23, 42, 0.94)",
        border: "1px solid rgba(148, 163, 184, 0.9)",
        color: "#e5e7eb",
        fontSize: "0.78rem",
        lineHeight: 1.4,
        boxShadow: "0 18px 45px rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 15,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: "0.9rem",
          marginBottom: 4,
          color: "#bfdbfe",
        }}
      >
        {title}
      </div>

      <div
        style={{
          maxHeight: 150,
          overflowY: "auto",
          paddingRight: 4,
        }}
      >
        {bodyLines.map((line, idx) =>
          line === "" ? (
            <div key={idx} style={{ height: 4 }} />
          ) : (
            <p key={idx} style={{ margin: "0 0 3px" }}>
              {line}
            </p>
          )
        )}
      </div>

      {showNextButton && (
        <button
          onClick={onNextStep}
          style={{
            marginTop: 8,
            padding: "6px 10px",
            borderRadius: 999,
            border: "none",
            background: lessonStep.endsWith("_done")
              ? "rgba(34,197,94,0.15)"
              : "rgba(59,130,246,0.18)",
            color: lessonStep.endsWith("_done") ? "#4ade80" : "#60a5fa",
            fontSize: "0.72rem",
            fontWeight: 600,
            cursor: "pointer",
            float: "right",
          }}
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
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

  // 🔥 lesson states for all DSA
  const [lessonStep, setLessonStep] = useState(null);
  const [targetIndex, setTargetIndex] = useState(null); // for Array task
  const [taskMessage, setTaskMessage] = useState("");

  // refs for use inside detection loop
  const selectedDSARef = useRef(selectedDSA);
  const lessonStepRef = useRef(lessonStep);
  const targetIndexRef = useRef(targetIndex);
  const conceptRef = useRef(concept);

  // base counts for tasks
  const queueBaseCountRef = useRef(null);
  const stackBaseBooksRef = useRef(null);
  const listBaseCountRef = useRef(null);

  useEffect(() => {
    selectedDSARef.current = selectedDSA;
  }, [selectedDSA]);

  useEffect(() => {
    lessonStepRef.current = lessonStep;
  }, [lessonStep]);

  useEffect(() => {
    targetIndexRef.current = targetIndex;
  }, [targetIndex]);

  useEffect(() => {
    conceptRef.current = concept;
  }, [concept]);

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
            if (mode === "Queue") {
              setLessonStep((prev) =>
                prev && prev.startsWith("queue_") ? prev : "queue_intro"
              );
            }
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
          if (mode === "Stack") {
            setLessonStep((prev) =>
              prev && prev.startsWith("stack_") ? prev : "stack_intro"
            );
          }
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
            if (mode === "Linked List") {
              setLessonStep((prev) =>
                prev && prev.startsWith("linked_") ? prev : "linked_intro"
              );
            }
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
          if (mode === "Array") {
            setLessonStep((prev) =>
              prev && prev.startsWith("array_") ? prev : "array_intro"
            );
            setTargetIndex((prev) =>
              prev == null ? Math.floor(arrayLikeCount / 2) : prev
            );
          }
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

      // ⭐ Do NOT draw boxes if only 1 array object
      if (arrayObjects.length > 1 && (mode === "Auto" || mode === "Array")) {
        arrayObjects.forEach((p, index) => {
          const [x, y, width, height] = p.bbox;

          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, width, height);

          const label = `index[${index}] ${p.class}`;
          const labelHeight = 26;
          const labelPaddingX = 8;

          ctx.font = "16px Arial";
          const textWidth = ctx.measureText(label).width;
          const bgWidth = Math.max(textWidth + labelPaddingX * 2, width);

          ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
          ctx.fillRect(x, y + height, bgWidth, labelHeight);

          ctx.fillStyle = "#00ff00";
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

      // ⭐ Do NOT draw queue boxes if only 1
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

      // ⭐ Do NOT draw linked list boxes if only 1 node
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

            // ===== LESSON TASK CHECKING =====
            const currentLessonStep = lessonStepRef.current;
            const currentConcept = normalizeConcept(conceptRef.current);

            // Array task: make correct index the largest object
            const arrayObjects = getArrayObjects(predictions);
            const currentTargetIndex = targetIndexRef.current;

            if (
              currentLessonStep === "array_task_1" &&
              currentConcept === "Array" &&
              currentTargetIndex != null &&
              arrayObjects.length > currentTargetIndex
            ) {
              const areas = arrayObjects.map((p) => {
                const [, , w, h] = p.bbox;
                const safeW = Math.max(0, w);
                const safeH = Math.max(0, h);
                return safeW * safeH;
              });

              if (areas.length > 0) {
                const maxArea = Math.max(...areas);
                const maxIndex = areas.indexOf(maxArea);

                if (maxIndex === currentTargetIndex) {
                  setTaskMessage(
                    `✅ Correct! You focused on the element at index ${currentTargetIndex}. This simulates arr[${currentTargetIndex}] — direct access to a fixed position (O(1) time).`
                  );
                  setLessonStep("array_task_1_done");
                }
              }
            }

            // Queue task: Q[0] becomes closest (largest area) among queue items
            if (
              currentLessonStep === "queue_task_1" &&
              currentConcept === "Queue" &&
              queueItems.length >= 2
            ) {
              const sortedByX = [...queueItems].sort(
                (a, b) => a.bbox[0] - b.bbox[0]
              );
              const frontItem = sortedByX[0];

              const areas = sortedByX.map((p) => {
                const [, , w, h] = p.bbox;
                return Math.max(0, w) * Math.max(0, h);
              });

              const maxArea = Math.max(...areas);
              const maxIdx = areas.indexOf(maxArea);

              if (maxIdx === 0) {
                setTaskMessage(
                  "✅ Correct! You brought Q[0] (the front of the line) closer. This models a dequeue operation: the front element is served first."
                );
                setLessonStep("queue_task_1_done");
              }
            }

            // Stack task: number of books increased
            if (
              currentLessonStep === "stack_task_1" &&
              currentConcept === "Stack"
            ) {
              const base = stackBaseBooksRef.current;
              if (base != null && books.length > base) {
                setTaskMessage(
                  `✅ You increased the number of books from ${base} to ${books.length}. This models push(S, x) — pushing a new item on top of the stack.`
                );
                setLessonStep("stack_task_1_done");
              }
            }

            // Linked List task: number of nodes increased
            if (
              currentLessonStep === "linked_task_1" &&
              currentConcept === "Linked List"
            ) {
              const base = listBaseCountRef.current;
              if (base != null && linkedNodes.length > base) {
                setTaskMessage(
                  `✅ You increased the number of nodes from ${base} to ${linkedNodes.length}. This models appending a new node at the tail of a linked list.`
                );
                setLessonStep("linked_task_1_done");
              }
            }

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

  const guide = !concept ? getGuideText(selectedDSA) : null;

  // small badge config for guide overlay
  const getGuideBadge = () => {
    switch (selectedDSA) {
      case "Stack":
        return {
          label: "LIFO",
          bg: "rgba(251, 146, 60, 0.18)",
          color: "#fb923c",
        };
      case "Queue":
        return {
          label: "FIFO",
          bg: "rgba(34, 197, 94, 0.18)",
          color: "#22c55e",
        };
      case "Auto":
        return {
          label: "Auto-detect",
          bg: "rgba(168, 85, 247, 0.18)",
          color: "#a855f7",
        };
      case "Linked List":
        return {
          label: "Nodes + Pointers",
          bg: "rgba(250, 204, 21, 0.18)",
          color: "#facc15",
        };
      case "Array":
        return {
          label: "Index-based",
          bg: "rgba(59, 130, 246, 0.18)",
          color: "#60a5fa",
        };
      default:
        return null;
    }
  };

  const guideBadge = getGuideBadge();

  // handler for lesson "Next" button
  const handleNextLessonStep = () => {
    const mode = normalizeConcept(concept);

    if (mode === "Array") {
      if (lessonStep === "array_intro") {
        setTaskMessage("");
        setLessonStep("array_task_1");
      } else if (lessonStep === "array_task_1_done") {
        setLessonStep(null);
        setTaskMessage("");
      }
    } else if (mode === "Queue") {
      if (lessonStep === "queue_intro") {
        queueBaseCountRef.current = queueCount;
        setTaskMessage("");
        setLessonStep("queue_task_1");
      } else if (lessonStep === "queue_task_1_done") {
        queueBaseCountRef.current = null;
        setLessonStep(null);
        setTaskMessage("");
      }
    } else if (mode === "Stack") {
      if (lessonStep === "stack_intro") {
        stackBaseBooksRef.current = bookCount;
        setTaskMessage("");
        setLessonStep("stack_task_1");
      } else if (lessonStep === "stack_task_1_done") {
        stackBaseBooksRef.current = null;
        setLessonStep(null);
        setTaskMessage("");
      }
    } else if (mode === "Linked List") {
      if (lessonStep === "linked_intro") {
        listBaseCountRef.current = linkedListCount;
        setTaskMessage("");
        setLessonStep("linked_task_1");
      } else if (lessonStep === "linked_task_1_done") {
        listBaseCountRef.current = null;
        setLessonStep(null);
        setTaskMessage("");
      }
    }
  };

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
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 8,
            height: 8,
            borderRadius: 999,
            background:
              status && status.startsWith("❌") ? "#ef4444" : "#22c55e",
          }}
        />
        <span>DSA Concept Detection · {status}</span>
      </div>

      {/* 🔹 MODE GUIDE – FLOATING CARD, only before any concept is detected */}
      {!isLoading && guide && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            padding: "0 16px 18px",
            pointerEvents: "none",
            zIndex: 12,
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 420,
              padding: "12px 14px 10px",
              borderRadius: 14,
              background: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(148, 163, 184, 0.9)",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              lineHeight: 1.35,
              boxShadow: "0 18px 45px rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
          >
            {/* Header row: title + badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
                gap: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    color: "#facc15",
                    marginBottom: 2,
                  }}
                >
                  {guide.title}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    opacity: 0.8,
                    color: "#cbd5f5",
                  }}
                >
                  Quick setup guide for this mode.
                </div>
              </div>

              {guideBadge && (
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 999,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    background: guideBadge.bg,
                    color: guideBadge.color,
                    whiteSpace: "nowrap",
                  }}
                >
                  {guideBadge.label}
                </span>
              )}
            </div>

            {/* Body lines */}
            <div
              style={{
                maxHeight: 140,
                overflowY: "auto",
                paddingRight: 4,
              }}
            >
              {guide.lines.map((line, idx) => {
                if (line === "") {
                  return (
                    <div
                      key={idx}
                      style={{
                        height: 6,
                      }}
                    />
                  );
                }

                const isSectionTitle = line.endsWith(":");

                if (isSectionTitle) {
                  return (
                    <p
                      key={idx}
                      style={{
                        margin: "6px 0 2px",
                        fontSize: "0.65rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: "#9ca3af",
                        fontWeight: 600,
                      }}
                    >
                      {line.replace(":", "")}
                    </p>
                  );
                }

                return (
                  <p
                    key={idx}
                    style={{
                      margin: "0 0 2px",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {line}
                  </p>
                );
              })}
            </div>

            <p
              style={{
                marginTop: 8,
                fontSize: "0.7rem",
                opacity: 0.75,
              }}
            >
              Hold the camera steady and move slowly until the structure is
              detected. The overlay will disappear once a concept is recognized.
            </p>
          </div>
        </div>
      )}

      {/* 🔥 LESSON OVERLAY – explanation + AR tasks for all DSA */}
      <LessonOverlay
        lessonStep={lessonStep}
        concept={concept}
        targetIndex={targetIndex}
        taskMessage={taskMessage}
        onNextStep={handleNextLessonStep}
      />

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
