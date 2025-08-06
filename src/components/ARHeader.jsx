import { Scan } from "lucide-react";

const ARHeader = () => {
  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <Scan className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">AR Assessment</h2>
      </div>
    </div>
  );
};

export default ARHeader;
