import type { InningsWhereInput } from "zenstack/output/input";

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { TeamStats } from "@/lib/types";

import { validateDate } from "@/components/date-filter";
import { TabsLayout } from "@/components/tabs-layout";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { db } from "@/lib/db";
import { ballsToOvers } from "@/lib/utils";

const getTeamStats = createServerFn({ method: "GET" })
	.validator(validateDate)
	.handler(async ({ data }): Promise<TeamStats[]> => {
		const whereClause: InningsWhereInput = { match: { date: data } };

		const teamsWithInnings = await db.innings.findMany({
			where: whereClause,
			select: { teamId: true },
			distinct: ["teamId"],
		});

		const teamIds = teamsWithInnings.map((t) => t.teamId);

		if (teamIds.length === 0) {
			return [];
		}

		// Parallel queries for all stats - much more efficient than N queries per team
		const [matchStats, winStats, aggregateStats, lowestScores, highestScores] = await Promise.all([
			// Count unique matches played per team (distinct teamId + matchId pairs)
			db.innings.groupBy({
				by: ["teamId", "matchId"],
				where: { teamId: { in: teamIds }, ...whereClause },
			}),

			// Matches won per team
			db.matches.groupBy({
				by: ["winnerId"],
				where: { winnerId: { in: teamIds }, date: data },
				_count: { winnerId: true },
			}),

			// Aggregate stats (runs, balls, wickets, allOuts)
			db.innings.groupBy({
				by: ["teamId"],
				where: { teamId: { in: teamIds }, ...whereClause },
				_sum: { runs: true, balls: true, wickets: true, allOuts: true },
			}),

			// Lowest scores for each team
			Promise.all(
				teamIds.map((teamId) =>
					db.innings.findFirst({
						where: { teamId, allOuts: data?.date ? undefined : 1, ...whereClause },
						orderBy: { runs: "asc" },
					}),
				),
			),

			// Highest scores for each team
			Promise.all(
				teamIds.map((teamId) =>
					db.innings.findFirst({
						where: { teamId, match: { totalOvers: data?.date ? undefined : 8, ...whereClause.match } },
						orderBy: { runs: "desc" },
					}),
				),
			),
		]);

		// Build lookup maps for O(1) access
		const matchCountMap = new Map<string, number>();
		for (const { teamId } of matchStats) {
			matchCountMap.set(teamId, (matchCountMap.get(teamId) ?? 0) + 1);
		}
		const winCountMap = new Map(winStats.map((w) => [w.winnerId, w._count.winnerId]));
		const aggregateMap = new Map(aggregateStats.map((a) => [a.teamId, a._sum]));
		const lowestScoreMap = new Map(teamIds.map((id, i) => [id, lowestScores[i]]));
		const highestScoreMap = new Map(teamIds.map((id, i) => [id, highestScores[i]]));

		// Build final stats array
		return teamIds.map((teamId) => {
			const playedMatches = matchCountMap.get(teamId) || 0;
			const wonMatches = winCountMap.get(teamId) || 0;
			const aggregate = aggregateMap.get(teamId) || { runs: 0, balls: 0, wickets: 0, allOuts: 0 };
			const lowestScore = lowestScoreMap.get(teamId);
			const highestScore = highestScoreMap.get(teamId);

			return {
				team: teamId,
				playedMatches,
				wonMatches,
				winPercent: playedMatches ? Number(((wonMatches / playedMatches) * 100).toFixed()) : 0,
				totalRuns: aggregate.runs || 0,
				totalBalls: aggregate.balls || 0,
				totalWickets: aggregate.wickets || 0,
				totalAllOuts: aggregate.allOuts || 0,
				strikeRate: aggregate.balls ? (aggregate.runs / aggregate.balls) * 100 : 0,
				lowestScore: lowestScore
					? `${lowestScore.runs}${!lowestScore.allOuts ? `-${lowestScore.wickets}` : ""} (${ballsToOvers(lowestScore.balls)})`
					: "-",
				highestScore: highestScore
					? `${highestScore.runs}${!highestScore.allOuts ? `-${highestScore.wickets}` : ""} (${ballsToOvers(highestScore.balls)})`
					: "-",
			};
		});
	});

export const Route = createFileRoute("/_stats/stats/teams")({
	head: () => ({ meta: [{ title: "Teams Stats" }] }),
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) =>
		await context.queryClient.ensureQueryData({
			queryKey: ["teams-stats", deps.date ?? deps.rivalry ?? "all-time"],
			queryFn: () => getTeamStats({ data: deps }),
		}),
	component: () => {
		const isMobile = useIsMobile();
		const data = Route.useLoaderData();
		const teamStats = data.sort((a, b) => b.winPercent - a.winPercent);

		const statsConfig = [
			{ label: "Matches Played", key: "playedMatches" as const },
			{ label: "Matches Won", key: "wonMatches" as const },
			{ label: "Win Percentage", key: "winPercent" as const, format: (val: number) => `${val}%` },
			{ label: "Total Runs Scored", key: "totalRuns" as const },
			{ label: "Total Balls Played", key: "totalBalls" as const },
			{ label: "Total Wickets Fallen", key: "totalWickets" as const },
			{ label: "Strike Rate", key: "strikeRate" as const, format: (val: number) => val.toFixed(2) },
			{ label: "Team All-Out", key: "totalAllOuts" as const },
			{ label: "Highest Score", key: "highestScore" as const },
			{ label: "Lowest Score", key: "lowestScore" as const },
		];

		return (
			<TabsLayout title="Teams Stats">
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel defaultSize={100} minSize={isMobile ? 100 : 40}>
						<div className="overflow-hidden rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Stats</TableHead>
										{teamStats.map(({ team }, index) => (
											<TableHead key={index}>{team}</TableHead>
										))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{statsConfig.map(({ label, key, format }) => (
										<TableRow key={key}>
											<TableCell>{label}</TableCell>
											{teamStats.map((stat, index) => {
												const value = stat[key];
												const displayValue = format ? format(value as number) : value;
												return <TableCell key={index}>{displayValue}</TableCell>;
											})}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={0}>
						<div />
					</ResizablePanel>
				</ResizablePanelGroup>
			</TabsLayout>
		);
	},
});
