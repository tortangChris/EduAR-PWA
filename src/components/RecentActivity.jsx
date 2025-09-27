import React, { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import modulesConfig from "../config/modulesConfig";

const RecentActivity = () => {
  const [activities, setActivities] = useState([]);

  const todayKey = new Date().toISOString().split("T")[0];
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

  const getModuleImage = (title) => {
    const module = modulesConfig.find((m) => m.title === title);
    return module ? module.image : null;
  };

  return (
    <div className="bg-base-200 p-5 rounded-2xl shadow-lg mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        <span className="text-sm text-gray-500">As of {currentDate}</span>
      </div>
      <div className="h-px bg-gradient-to-r from-primary/40 to-transparent mb-3"></div>

      {activities.length > 0 ? (
        <ul className="space-y-2">
          {activities.map((act, idx) => {
            const moduleImage = getModuleImage(act.moduleTitle);
            return (
              <li
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition"
              >
                {moduleImage ? (
                  <img
                    src={moduleImage}
                    alt={act.moduleTitle}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                ) : (
                  <BookOpen className="w-8 h-8 text-primary" />
                )}

                <div className="flex flex-col flex-1">
                  <span className="text-sm font-medium">{act.moduleTitle}</span>
                  {act.time && (
                    <span className="text-xs text-gray-500">{act.time}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <BookOpen className="w-10 h-10 mb-2 text-gray-500" />
          <p className="text-sm">No activities yet today</p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;
