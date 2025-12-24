export function calculateDailyGoal(weight: number, height: number): number {
  const baseWater = weight * 33;
  const heightFactor = height > 180 ? 1.1 : height < 160 ? 0.9 : 1;
  return Math.round((baseWater * heightFactor) / 100) * 100;
}

export function calculateDynamicGoal(baseGoal: number, goalAdjustmentFactor: number): number {
  return Math.round((baseGoal * goalAdjustmentFactor) / 100) * 100;
}

export function getStreakDays(logs: { timestamp: number }[]): number {
  if (logs.length === 0) return 0;

  const sortedLogs = [...logs].sort((a, b) => b.timestamp - a.timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dayStart = checkDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

    const hasLog = sortedLogs.some(
      (log) => log.timestamp >= dayStart && log.timestamp < dayEnd
    );

    if (hasLog) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export function getTodayLogs(
  logs: { timestamp: number }[]
): { timestamp: number }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;

  return logs.filter(
    (log) => log.timestamp >= todayStart && log.timestamp < todayEnd
  );
}
