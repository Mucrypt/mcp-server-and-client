export function calcPositionSize(
  balance: number,
  riskPercent: number,
  entry: number,
  stop: number
) {
  const riskAmount = (balance * riskPercent) / 100;
  const stopDistance = Math.abs(entry - stop);
  if (stopDistance <= 0) return 0;
  return riskAmount / stopDistance;
}
export function calcRiskPercent(
    balance: number,
    positionSize: number,
    entry: number,
    stop: number
): number {
    const stopDistance = Math.abs(entry - stop);
    if (balance <= 0 || stopDistance <= 0) return 0;
    const riskAmount = positionSize * stopDistance;
    return (riskAmount / balance) * 100;
} 
    