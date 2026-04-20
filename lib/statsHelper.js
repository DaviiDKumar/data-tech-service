import User from "@/models/User";

export async function syncUserStats(userId, oldStatus, newStatus) {
  const update = {};

  // 1. Purane status ka count -1 karo
  if (oldStatus && oldStatus !== "default") {
    const oldField = `stats.${oldStatus}Count`;
    update[oldField] = -1;
  }

  // 2. Naye status ka count +1 karo
  if (newStatus && newStatus !== "default") {
    const newField = `stats.${newStatus}Count`;
    update[newField] = 1;
  }

  // Database mein atomic update ($inc)
  if (Object.keys(update).length > 0) {
    await User.findByIdAndUpdate(userId, { $inc: update });
  }
}