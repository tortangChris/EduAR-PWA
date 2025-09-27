import ProgressCard from "../components/ProgressCard";
import RecentActivity from "../components/RecentActivity";
import BottomNav from "../components/BottomNav";
import { User } from "lucide-react";

const Home = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.username || "Guest";
  const profileImage = user?.avatar || null;

  const progress = 0;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      {/* Header */}
      <div className="sticky top-0 z-10">
        <div className="bg-base-200 rounded-2xl shadow-md p-5 flex items-center gap-4 backdrop-blur-sm">
          {/* Avatar with outer border circle */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-primary/40">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
          </div>

          {/* Welcome text */}
          <div>
            <h2 className="text-xl font-bold">Welcome, {username}</h2>
            <p className="text-sm text-gray-500">Good to see you again!</p>
          </div>
        </div>
      </div>

      {/* Cards */}
      <ProgressCard progress={progress} />
      <RecentActivity />

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default Home;
