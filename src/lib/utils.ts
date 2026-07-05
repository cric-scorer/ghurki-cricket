import { format as dateFormatter } from "date-fns";

export { cn, type ClassValue } from "cnfast";

export function formatDate(date: string | Date | null | undefined, format: "eng" | "numeric" = "eng"): string {
	if (!date) return "All Time";
	return dateFormatter(new Date(date), format === "eng" ? "MMM dd, yyyy" : "yyyy-MM-dd");
}

export function ballsToOvers(balls: number): string {
	if (balls < 0) return "0.0";
	const completedOvers = Math.floor(balls / 6);
	const remainingBalls = balls % 6;
	return `${completedOvers}.${remainingBalls}`;
}
