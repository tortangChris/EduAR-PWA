// ../components/ObjectDetection.jsx
import React, { useRef, useEffect, useState } from "react";

const ObjectDection = ({ selectedDSA = "none" }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Loading model...");
  const [arrayCount, setArrayCount] = useState(0);
  const [concept, setConcept] = useState("");
  const [conceptDetail, setConceptDetail] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 ref para sa kasalukuyang DSA mode (galing sa parent)
  const selectedDSARef = useRef(selectedDSA);
  useEffect(() => {
    selectedDSARef.current = selectedDSA;
  }, [selectedDSA]);

  useEffect(() => {
    let model = null;
    let animationFrameId = null;
    let lastDetection = 0;
    const DETECT_INTERVAL = 200; // ms

    // 👉 Helper: approximate frontview vs sideview gamit aspect ratio
    const isFrontView = (bbox) => {
      const [, , width, height] = bbox;
      if (!width || !height) return true;

      const aspect = width / height;
      // Assumption:
      // - mas "square / wide" (aspect >= 0.8) → frontview
      // - mas "payat / tall" → sideview (hindi isasali sa Array)
      return aspect >= 0.8;
    };

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

    const analyzeScene = (predictions) => {
      const mode = selectedDSARef.current; // "none" | "Auto" | "Array" | ...

      // ➜ Huwag mag-detect ng DSA kung wala pang napipili
      if (!mode || mode === "none") {
        setConcept("");
        setConceptDetail("");
        return;
      }

      // 🔎 Filter per class (now including laptop, book, chair)
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );
      const bottles = predictions.filter(
        (p) => p.class === "bottle" && p.score > 0.4
      );
      const laptops = predictions.filter(
        (p) => p.class === "laptop" && p.score > 0.4
      );
      const books = predictions.filter(
        (p) => p.class === "book" && p.score > 0.4
      );
      const chairs = predictions.filter(
        (p) => p.class === "chair" && p.score > 0.4
      );

      const allArrayCandidates = [
        ...phones,
        ...bottles,
        ...laptops,
        ...books,
        ...chairs,
      ];

      // 🧭 Para sa Array: dapat FRONT VIEW lang (hindi sideview)
      const frontViewArrayObjects = allArrayCandidates.filter((p) =>
        isFrontView(p.bbox)
      );

      const tryArray = () => {
        const arrayLikeCount = frontViewArrayObjects.length;

        if (arrayLikeCount >= 2) {
          setConcept("Array");
          setConceptDetail(
            `Detected ${arrayLikeCount} front-view objects (cellphones, bottles, laptops, books, chairs) → can be modeled as an Array (index-based, fixed positions).` +
              `\n\nNote: Side-view objects are ignored here so they won’t be misclassified as Array (reserved for Queue / other structures).`
          );
          return true;
        }
        return false;
      };

      // Sa ngayon, ang "Auto" at "Array" mode lang ang may logic
      if (mode === "Auto" || mode === "Array") {
        if (!tryArray()) {
          setConcept("");
          setConceptDetail("");
        }
        return;
      }

      // Iba pang mode (Stack, Queue, Linked List) – wala munang ginagawa
      setConcept("");
      setConceptDetail("");
    };

    const draw = (predictions) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mode = selectedDSARef.current;

      // 🔎 Same filters as analyzeScene
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );
      const bottles = predictions.filter(
        (p) => p.class === "bottle" && p.score > 0.4
      );
      const laptops = predictions.filter(
        (p) => p.class === "laptop" && p.score > 0.4
      );
      const books = predictions.filter(
        (p) => p.class === "book" && p.score > 0.4
      );
      const chairs = predictions.filter(
        (p) => p.class === "chair" && p.score > 0.4
      );

      const allArrayCandidates = [
        ...phones,
        ...bottles,
        ...laptops,
        ...books,
        ...chairs,
      ];

      // FRONT VIEW lang ang lalagyan ng index[ ] (Array)
      const frontViewArrayObjects = allArrayCandidates.filter((p) =>
        isFrontView(p.bbox)
      );

      // ✅ Ito lang ang ibibilang as array count
      setArrayCount(frontViewArrayObjects.length);

      if (
        frontViewArrayObjects.length > 0 &&
        (mode === "Auto" || mode === "Array")
      ) {
        frontViewArrayObjects.forEach((p, index) => {
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

      // (Optional) pwede kang mag-drawing dito ng ibang color
      // para sa sideview objects for future Queue logic.
      // const sideViewObjects = allArrayCandidates.filter(
      //   (p) => !isFrontView(p.bbox)
      // );
    };

    const detectLoop = async () => {
      const now = performance.now();
      if (now - lastDetection >= DETECT_INTERVAL) {
        lastDetection = now;

        if (model && videoRef.current) {
          try {
            const predictions = await model.detect(videoRef.current);

            draw(predictions);
            analyzeScene(predictions);
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
          maxWidth: "100%",
        }}
      >
        DSA Concept Detection · {status} · Array count (frontview only):{" "}
        {arrayCount}
      </div>

      {/* DATA STRUCTURE OVERLAY – only when may concept */}
      {concept && (
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            transform: "none",
            maxWidth: "65%",
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(15, 23, 42, 0.85)",
            border: "1px solid rgba(148, 163, 184, 0.9)",
            color: "#f9fafb",
            fontSize: "0.75rem",
            lineHeight: 1.3,
            backdropFilter: "blur(4px)",
            maxHeight: "35%",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              marginBottom: 2,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>🧠</span>
            <span>
              Detected:{" "}
              <span style={{ color: "#34D399" }}>{concept}</span>
            </span>
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
