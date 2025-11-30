import { ScanIcon } from "lucide-react";
import ModulesContent from "../components/ModulesContent";
import BottomNav from "../components/BottomNav";
import ARSupportChecker from "./ARSupportChecker";
import ObjectDection from "../components/ObjectDetection";

const ARDetection = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center justify-between backdrop-blur-sm">
          {/* Left side: icon + title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <ScanIcon className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Scan Objects</h2>
              <p className="text-sm text-gray-500">
                Find the Real-Object of Data Structure
              </p>
            </div>
          </div>
        </div>
      </div>

       <div className="bg-base-200 rounded-2xl shadow-md h-[calc(70vh-6.5rem)] overflow-y-auto p-5">
        <ObjectDection/>
         {/* <button
            onClick={() => setActiveView("assessment")}
            className="w-55 h-48 bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center p-4 hover:scale-105 transition-transform"
          >
            <div className="w-20 h-20 bg-gray-300 rounded-md mb-2"></div>
            <span className="text-sm font-semibold text-center">
              3D AR Assessment
            </span>
          </button> */}
      </div>

      <BottomNav />
    </div>
  );
};

export default ARDetection;
