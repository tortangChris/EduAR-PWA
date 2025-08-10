import ProgressCard from "../components/ProgressCard";
import RecentActivity from "../components/RecentActivity";
import BottomNav from "../components/BottomNav";

const Home = () => {
  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "Guest";

  const progress = 0;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
          <h2 className="text-xl font-bold">Welcome, {username}</h2>
        </div>
      </div>
      <ProgressCard progress={progress} />
      <RecentActivity />
      <BottomNav />
    </div>
  );
};

export default Home;
