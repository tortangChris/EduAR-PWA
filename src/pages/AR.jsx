import BottomNav from "../components/BottomNav";
import ARContent from "../components/ARContent.";
import ARHeader from "../components/ARHeader";

const AR = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ARHeader />
      <ARContent />
      <BottomNav />
    </div>
  );
};

export default AR;
