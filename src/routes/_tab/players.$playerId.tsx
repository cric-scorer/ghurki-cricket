import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { PlayerAvatar } from "@/components/players/avatar";
import { TabsLayout } from "@/components/tabs-layout";
import { ResizablePanelGroup, ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
import { db } from "@/lib/db";
import { ballsToOvers, cn } from "@/lib/utils";

const getPlayerDetail = createServerFn({ method: "GET" })
	.validator(z.string())
	.handler(async ({ data: playerId }) => {
		const [player, higherRatedCount] = await Promise.all([
			db.players.findFirst({
				where: { name: { equals: playerId, mode: "insensitive" } },
				include: {
					batting: true,
					bowling: true,
					fielding: true,
					_count: { select: { playerOfMatches: true } },
				},
			}),
			(async () => {
				const p = await db.players.findFirst({
					where: { name: { equals: playerId, mode: "insensitive" } },
					select: { rating: true },
				});
				if (!p) return 0;
				return db.players.count({
					where: { rating: { gt: p.rating } },
				});
			})(),
		]);

		if (!player) throw notFound();

		const rank = (higherRatedCount ?? 0) + 1;

		const battingStats = player.batting.reduce(
			(acc, curr) => ({
				innings: acc.innings + curr.innings,
				runs: acc.runs + curr.runs,
				balls: acc.balls + curr.balls,
				highestScore: Math.max(acc.highestScore, curr.highestScore),
				notOuts: acc.notOuts + curr.notOuts,
				fours: acc.fours + curr.fours,
				sixes: acc.sixes + curr.sixes,
				ducks: acc.ducks + curr.ducks,
				thirties: acc.thirties + curr.thirties,
				fifties: acc.fifties + curr.fifties,
			}),
			{
				innings: 0,
				runs: 0,
				balls: 0,
				highestScore: 0,
				notOuts: 0,
				fours: 0,
				sixes: 0,
				ducks: 0,
				thirties: 0,
				fifties: 0,
			},
		);

		const battingAv = battingStats.innings - battingStats.notOuts;
		const batting = {
			...battingStats,
			average: battingAv > 0 ? battingStats.runs / battingAv : battingStats.runs,
			strikeRate: battingStats.balls > 0 ? (battingStats.runs / battingStats.balls) * 100 : 0,
		};

		const bowlingStats = player.bowling.reduce(
			(acc, curr) => ({
				innings: acc.innings + curr.innings,
				runs: acc.runs + curr.runs,
				balls: acc.balls + curr.balls,
				wickets: acc.wickets + curr.wickets,
				dots: acc.dots + curr.dots,
				wides: acc.wides + curr.wides,
				noBalls: acc.noBalls + curr.noBalls,
				twoFR: acc.twoFR + curr.twoFR,
				threeFR: acc.threeFR + curr.threeFR,
			}),
			{
				innings: 0,
				runs: 0,
				balls: 0,
				wickets: 0,
				dots: 0,
				wides: 0,
				noBalls: 0,
				twoFR: 0,
				threeFR: 0,
			},
		);

		const bowling = {
			...bowlingStats,
			average: bowlingStats.wickets > 0 ? bowlingStats.runs / bowlingStats.wickets : 0,
			economy: bowlingStats.balls > 0 ? (bowlingStats.runs / bowlingStats.balls) * 6 : 0,
			strikeRate: bowlingStats.wickets > 0 ? bowlingStats.balls / bowlingStats.wickets : 0,
		};

		const fielding = player.fielding.reduce(
			(acc, curr) => ({
				innings: acc.innings + curr.innings,
				catches: acc.catches + curr.catches,
				runOuts: acc.runOuts + curr.runOuts,
			}),
			{ innings: 0, catches: 0, runOuts: 0 },
		);

		return {
			name: player.name,
			rank,
			rating: player.rating,
			attendance: player.attendance,
			potm: player._count.playerOfMatches,
			batting,
			bowling,
			fielding,
		};
	});

export const Route = createFileRoute("/_tab/players/$playerId")({
	loader: ({ context, params }) =>
		context.queryClient.ensureQueryData({
			queryKey: ["playerDetail", params.playerId],
			queryFn: async () => await getPlayerDetail({ data: params.playerId }),
		}),
	head: ({ loaderData }) => ({ meta: [{ title: loaderData?.name || "Player not Found" }] }),
	component: () => {
		const { name, rank, potm, attendance, batting, bowling, fielding } = Route.useLoaderData();
		return (
			<TabsLayout title={name} dateFilter={null}>
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel defaultSize={100} minSize={50}>
						<div className="@container relative flex flex-col gap-8 rounded-md border bg-card py-8">
							<div className="grid gap-6 @3xl:grid-cols-2">
								<div className="flex flex-col items-center justify-center gap-3 @3xl:flex-row @3xl:justify-start @3xl:pl-14">
									<PlayerAvatar name={name} area={100} className="size-20 shadow-sm" />
									<div className="flex flex-col gap-1">
										<h2 className="text-2xl font-bold text-foreground uppercase sm:text-3xl">{name}</h2>
										<p className="text-sm font-medium tracking-wide text-muted-foreground uppercase opacity-70">All Rounder</p>
									</div>
								</div>
								<div className="grid grid-cols-3 gap-6 @3xl:pr-10 @4xl:pr-4 @5xl:pr-0">
									<StatItem className="justify-center" label="Ranking" value={rank > 0 ? `#${rank}` : "—"} />
									<StatItem className="justify-center" label="POTM" value={potm} />
									<StatItem className="justify-center" label="Attendance" value={`${attendance}%`} />
								</div>
							</div>

							<div className="flex items-center justify-center gap-2 bg-muted px-4 py-3">
								<img src="/icons/bat.png" className="size-5" alt="bat" />
								<h3 className="text-base font-bold tracking-wide text-primary uppercase">Batting Performance</h3>
							</div>
							<div className="grid grid-cols-3 gap-6 @3xl:grid-cols-4 @4xl:grid-cols-5 @5xl:grid-cols-6">
								<StatItem label="Innings" value={batting.innings} />
								<StatItem label="Runs" value={batting.runs} />
								<StatItem label="Balls" value={batting.balls} />
								<StatItem label="Not Outs" value={batting.notOuts} />
								<StatItem label="Strike Rate" value={batting.strikeRate.toFixed()} />
								<StatItem label="Average" value={batting.average.toFixed()} />
								<StatItem label="Highest" value={batting.highestScore} />
								<StatItem label="Fours" value={batting.fours} />
								<StatItem label="Sixes" value={batting.sixes} />
								<StatItem label="Ducks" value={batting.ducks} />
								<StatItem label="Thirties" value={batting.thirties} />
								<StatItem label="Fifties" value={batting.fifties} />
								{/* <StatItem label="Hundreds" value={name === "Hamas" ? 1 : 0} /> */}
							</div>

							<div className="flex items-center justify-center gap-2 bg-muted px-4 py-3">
								<img src="/icons/ball.png" className="size-5" alt="ball" />
								<h3 className="text-base font-bold tracking-wide text-primary uppercase">Bowling Performance</h3>
							</div>
							<div className="grid grid-cols-3 gap-6 @3xl:grid-cols-4 @4xl:grid-cols-5 @5xl:grid-cols-6">
								<StatItem label="Innings" value={bowling.innings} />
								<StatItem label="Wickets" value={bowling.wickets} />
								<StatItem label="Runs" value={bowling.runs} />
								<StatItem label="Overs" value={ballsToOvers(bowling.balls).split(".")[0]} />
								<StatItem label="Economy" value={bowling.economy.toFixed(1)} />
								<StatItem label="Average" value={bowling.average.toFixed(1)} />
								<StatItem label="Dots" value={bowling.dots} />
								<StatItem label="Wides" value={bowling.wides} />
								<StatItem label="No Balls" value={bowling.noBalls} />
								<StatItem label="Maidens" value={name === "Hamas" ? 2 : 0} />
								<StatItem label="2 Fer" value={bowling.twoFR} />
								<StatItem label="3 Fer" value={bowling.threeFR} />
							</div>

							<div className="flex items-center justify-center gap-2 bg-muted px-4 py-3">
								<img src="/icons/fielding.png" className="size-5" alt="fielding" />
								<h3 className="text-base font-bold tracking-wide text-primary uppercase">Fielding Performance</h3>
							</div>
							<div className="grid grid-cols-3 gap-6">
								<StatItem label="Innings" value={fielding.innings} />
								<StatItem label="Catches" value={fielding.catches} />
								<StatItem label="Run Outs" value={fielding.runOuts} />
							</div>
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

function StatItem({ label, value, className }: { label: string; value: string | number; className?: string }) {
	return (
		<div className={cn("flex flex-col gap-0.5", className)}>
			<span className="text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase opacity-70">{label}</span>
			<span className="text-center text-xl font-semibold tracking-tight sm:text-2xl">{value}</span>
		</div>
	);
}
