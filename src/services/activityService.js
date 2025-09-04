const STORAGE_KEY = "recentActivities";

export function logActivity(moduleTitle) {
  const now = new Date();
  const todayKey = now.toISOString().split("T")[0]; // YYYY-MM-DD

  const newActivity = {
    date: todayKey,
    time: now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }),
    moduleTitle,
  };

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

  const alreadyLogged = stored.some(
    (a) => a.date === todayKey && a.moduleTitle === moduleTitle
  );

  let updated;
  if (alreadyLogged) {
    updated = stored.map((a) =>
      a.date === todayKey && a.moduleTitle === moduleTitle ? newActivity : a
    );
  } else {
    updated = [...stored, newActivity];
  }

  // save ulit
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
