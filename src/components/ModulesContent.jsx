import React, { useEffect, useState } from "react";
import { BookOpenCheck, ChevronRight, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const ModulesContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialModules = [
    {
      title: "Arrays",
      description:
        "Stores elements of the same type in continuous memory, accessed by index.",
      route: "/modules/arrays",
    },
    {
      title: "Linked List",
      description:
        "Stores elements in nodes connected by pointers, allowing dynamic memory.",
      route: "/modules/searching-algorithms",
    },
    {
      title: "Stack",
      description: "Linear structure that follows LIFO (Last In, First Out).",
      route: "/modules/sorting-algorithms",
    },
    {
      title: "Queues",
      description: "Linear structure that follows FIFO (First In, First Out).",
      route: "/modules/introduction-to-datastructure",
    },
    {
      title: "Trees",
      description:
        "Hierarchical data structure made of nodes connected by edges.",
      route: "/modules/data-structures-intro",
    },
    {
      title: "Set Data Structure and Operations",
      description: "Stores unique elements without a defined order.",
      route: "/modules/advanced-data-structures",
    },
    {
      title: "Graph Data Structure and Operations",
      description:
        "Represents networks using vertices (nodes) and edges (connections).",
      route: "/modules/graph-algorithms",
    },
    {
      title: "Map Data Structure and Operations",
      description: "Stores key-value pairs for fast data retrieval.",
      route: "/modules/dynamic-programming",
    },
    {
      title: "Hash Tables",
      description:
        "Stores key-value pairs using a hash function for fast access.",
      route: "/modules/final-assessment",
    },
  ];

  const [modulesData, setModulesData] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load progress from localStorage or initialize
  useEffect(() => {
    const storedProgress = JSON.parse(localStorage.getItem("moduleProgress"));
    if (storedProgress) {
      const mergedModules = initialModules.map((mod, index) => ({
        ...mod,
        progress: storedProgress[index] || 0,
      }));
      setModulesData(mergedModules);
    } else {
      const initialized = initialModules.map((mod) => ({
        ...mod,
        progress: 0,
      }));
      setModulesData(initialized);
      localStorage.setItem(
        "moduleProgress",
        JSON.stringify(initialized.map(() => 0))
      );
    }
  }, []);

  // Update progress if coming back from finished module
  useEffect(() => {
    if (
      location.state &&
      location.state.finishedModuleIndex !== undefined &&
      modulesData.length > 0
    ) {
      const index = location.state.finishedModuleIndex;
      if (modulesData[index].progress < 100) {
        const updatedModules = [...modulesData];
        updatedModules[index].progress = 100;
        setModulesData(updatedModules);
        localStorage.setItem(
          "moduleProgress",
          JSON.stringify(updatedModules.map((m) => m.progress))
        );
      }
    }
  }, [location.state, modulesData]);

  const handleClick = (module, index) => {
    const isUnlocked = index === 0 || modulesData[index - 1].progress === 100;

    if (isUnlocked) {
      navigate(module.route, { state: { index } });
    } else {
      setErrorMessage(
        `⚠️ You need to finish "${modulesData[index - 1].title}" first.`
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="relative">
      {showError && (
        <div className="alert alert-error shadow-lg fixed top-4 right-4 z-50 w-[20rem] animate-fade-in">
          <div className="flex items-center justify-between w-full">
            <span>{errorMessage}</span>
            <button onClick={() => setShowError(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-4 space-y-4">
        {modulesData.map((module, index) => {
          const isClickable =
            index === 0 || modulesData[index - 1].progress === 100;

          return (
            <button
              key={index}
              onClick={() => handleClick(module, index)}
              className={`w-full text-left rounded-lg p-4 shadow flex flex-col gap-3 transition-all duration-150
                ${
                  isClickable
                    ? "cursor-pointer bg-white dark:bg-neutral hover:ring-2 hover:ring-primary hover:scale-[1.01]"
                    : "cursor-not-allowed bg-gray-100 dark:bg-base-300 opacity-70"
                }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 items-start">
                  <BookOpenCheck className="w-5 h-5 min-w-[1.25rem] min-h-[1.25rem] text-primary" />
                  <div>
                    <span className="font-semibold text-primary">
                      {module.title}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {module.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-primary mt-1" />
              </div>

              <div className="mt-2">
                <span className="text-xs text-gray-500">Progress</span>
                <progress
                  className="progress w-full progress-primary"
                  value={module.progress}
                  max="100"
                ></progress>
                <div className="flex justify-between mt-1">
                  <span className="text-xs font-semibold">
                    {module.progress}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModulesContent;
