import BottomNav from "../components/BottomNav";
import SimulationsContent from "../components/SimulationsContent";
import { ScanIcon } from "lucide-react";

const ARSimulation = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center gap-4 backdrop-blur-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <ScanIcon className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold">AR Simulation</h2>
            <p className="text-sm text-gray-500">Choose a topic to simulate</p>
          </div>
        </div>
      </div>

      <SimulationsContent />

      <BottomNav />
    </div>
  );
};

export default ARSimulation;
