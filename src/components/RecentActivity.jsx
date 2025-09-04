import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("recentActivities")) || [];
    const todayActivities = stored.filter((a) => a.date === todayKey);
    setActivities(todayActivities);
  }, [todayKey]);

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        <span className="text-sm text-gray-500">As of {currentDate}</span>
      </div>
      <div className="divider my-1"></div>

      {activities.length > 0 ? (
        <ul className="space-y-2">
          {activities.map((act, idx) => (
            <React.Fragment key={idx}>
              <li className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{act.moduleTitle}</span>
                  {act.time && (
                    <span className="text-xs text-gray-500">{act.time}</span>
                  )}
                </div>
              </li>
              {idx < activities.length - 1 && (
                <div className="divider my-1"></div>
              )}
            </React.Fragment>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
          <BookOpen className="w-10 h-10 mb-2 text-gray-500" />
          <p className="text-sm">No activities yet today</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
