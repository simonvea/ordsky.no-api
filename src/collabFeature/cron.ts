import cron from "node-cron";
import db from "./db.ts";

export function startCleanupJob() {
  // Run cleanup job every night at 2 AM
  cron.schedule("14 2 * * *", () => {
    console.log("Running stale session cleanup job...");
    try {
      const deletedCount = db.removeStaleSessions();
      console.log(`Cleaned up ${deletedCount} stale session(s)`);
    } catch (error) {
      console.error("Failed to run cleanup job:", error);
    }
  });

  console.log("Cleanup job scheduled to run daily at 2:14 AM");
}
