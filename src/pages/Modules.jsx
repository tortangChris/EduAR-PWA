import { BookOpen } from "lucide-react";
import ModulesContent from "../components/ModulesContent";
import BottomNav from "../components/BottomNav";
import ARSupportChecker from "./ARSupportChecker";

const Modules = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center justify-between backdrop-blur-sm">
          {/* Left side: icon + title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <BookOpen className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Modules</h2>
              <p className="text-sm text-gray-500">
                Browse and explore all lessons
              </p>
            </div>
          </div>

          <ARSupportChecker />
        </div>
      </div>

      <ModulesContent />

      <BottomNav />
    </div>
  );
};

export default Modules;
