import PersonalContent from "../components/PersonalContent";
import BottomNav from "../components/BottomNav";

const Personal = () => {
  return (
    <div className="h-screen p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
          <h2 className="text-xl font-bold">Personal Information</h2>
        </div>
      </div>
      <PersonalContent />
      <BottomNav />
    </div>
  );
};

export default Personal;
