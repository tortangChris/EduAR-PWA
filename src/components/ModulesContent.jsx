import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { X, Lock } from "lucide-react";

const ModulesContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const initialModules = [
    {
      title: "Arrays",
      route: "/modules/arrays",
      image: "/images/arraylogo.jpg",
    },
    {
      title: "Linked List",
      route: "/modules/linked-list",
      image: "/images/linkedlistlogo.jpg",
    },
    { title: "Stack", route: "/modules/stack", image: "/images/arraylogo.jpg" },
    {
      title: "Queues",
      route: "/modules/queue",
      image: "/images/arraylogo.jpg",
    },
    { title: "Trees", route: "/modules/trees", image: "/images/treelogo.jpg" },
    {
      title: "Set Data Structure and Operations",
      route: "/modules/set.jpg",
      image: "/images/setlogo.jpg",
    },
    {
      title: "Graph Data Structure and Operations",
      route: "/modules/graph-data-structure",
      image: "/images/graphlogo.jpg",
    },
    {
      title: "Map Data Structure and Operations",
      route: "/modules/map-data-structure",
      image: "/images/graphlogo.jpg",
    },
    {
      title: "Hash Tables",
      route: "/modules/hash-table",
      image: "/images/hashtablelogo.jpg",
    },
  ];

  const [modulesData, setModulesData] = useState([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

      <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {modulesData.map((module, index) => {
            const isUnlocked =
              index === 0 || modulesData[index - 1].progress === 100;

            return (
              <button
                key={index}
                onClick={() => handleClick(module, index)}
                className={`flex flex-col items-start justify-between rounded-lg p-2 shadow transition-all duration-150
                  ${
                    isUnlocked
                      ? "cursor-pointer bg-white dark:bg-neutral hover:ring-2 hover:ring-primary hover:scale-[1.02]"
                      : "cursor-not-allowed bg-gray-100 dark:bg-base-300 opacity-70"
                  }`}
              >
                <div className="w-full aspect-square flex items-center justify-center bg-gray-200 rounded-md overflow-hidden relative">
                  <img
                    src={module.image}
                    alt={module.title}
                    className="w-full h-full object-contain"
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                <div className="w-full flex flex-col mt-2 px-1">
                  <span className="font-semibold text-left text-primary text-sm mb-1">
                    {module.title}
                  </span>
                  <progress
                    className="progress w-full progress-primary"
                    value={module.progress}
                    max="100"
                  ></progress>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ModulesContent;
