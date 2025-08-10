import { BookOpen } from "lucide-react"; // <- idagdag ito
import ModulesContent from "../components/ModulesContent";
import BottomNav from "../components/BottomNav";

const Modules = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Modules</h2>
        </div>
      </div>
      <ModulesContent />
      <BottomNav />
    </div>
  );
};

export default Modules;
