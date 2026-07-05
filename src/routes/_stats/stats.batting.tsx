import { FilterIcon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { type ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
import { validateDate } from "@/components/date-filter";
import { PlayerAvatarCell } from "@/components/players/avatar";
import { TabsLayout } from "@/components/tabs-layout";
import { useIsMobile } from "@/hooks/use-mobile";
import { db } from "@/lib/db";
import { type BattingStats } from "@/lib/types";

const filters = [
	"most-runs",
	"best-strike-rate",
	"best-average",
	"most-not-outs",
	"highest-score",
	"most-fours",
	"most-sixes",
	"most-ducks",
	"most-thirties",
	"most-fifties",
	"four-ratio",
	"six-ratio",
	"duck-ratio",
] as const;

type Filter = (typeof filters)[number];

const filterSchema = z.enum(filters).optional().catch(undefined);

const getBattingStats = createServerFn({ method: "GET" })
	.inputValidator(validateDate)
	.handler(async ({ data }): Promise<BattingStats[]> => {
		const stats = await db.batters.groupBy({
			by: ["playerId"],
			where: { date: data },
			orderBy: { _sum: { runs: "desc" } },
			_max: { highestScore: true },
			_sum: {
				innings: true,
				runs: true,
				balls: true,
				notOuts: true,
				fours: true,
				sixes: true,
				ducks: true,
				thirties: true,
				fifties: true,
			},
		});
		return stats.map(({ playerId, _sum, _max }) => ({
			player: playerId,
			innings: _sum.innings,
			runs: _sum.runs,
			balls: _sum.balls,
			not_outs: _sum.notOuts,
			highest_score: _max.highestScore,
			strike_rate: _sum.balls ? (_sum.runs / _sum.balls) * 100 : 0,
			average: _sum.innings - _sum.notOuts ? _sum.runs / (_sum.innings - _sum.notOuts) : 0,
			fours: _sum.fours,
			fours_ratio: _sum.fours ? _sum.balls / _sum.fours : 0,
			sixes: _sum.sixes,
			six_ratio: _sum.sixes ? _sum.balls / _sum.sixes : 0,
			ducks: _sum.ducks,
			ducks_ratio: _sum.ducks ? _sum.innings / _sum.ducks : 0,
			fifties: _sum.fifties,
			thirties: _sum.thirties,
		}));
	});

const columns: Record<keyof BattingStats, ColumnDef<BattingStats>> = {
	player: { accessorKey: "player", header: "Player", cell: ({ row }) => <PlayerAvatarCell name={row.original.player} /> },
	innings: { accessorKey: "innings", header: "Inns" },
	runs: { accessorKey: "runs", header: "Runs" },
	balls: { accessorKey: "balls", header: "Balls" },
	not_outs: { accessorKey: "not_outs", header: "NO" },
	strike_rate: { accessorKey: "strike_rate", header: "SR", cell: ({ row }) => row.original.strike_rate.toFixed() },
	average: { accessorKey: "average", header: "Avg", cell: ({ row }) => row.original.average.toFixed() },
	highest_score: { accessorKey: "highest_score", header: "HS" },
	fours: { accessorKey: "fours", header: "4s" },
	fours_ratio: { accessorKey: "fours_ratio", header: "Balls / Fours", cell: ({ row }) => row.original.fours_ratio.toFixed(1) },
	sixes: { accessorKey: "sixes", header: "6s" },
	six_ratio: { accessorKey: "six_ratio", header: "Balls / Sixes", cell: ({ row }) => row.original.six_ratio.toFixed(1) },
	ducks: { accessorKey: "ducks", header: "0s" },
	ducks_ratio: { accessorKey: "ducks_ratio", header: "Inns / Ducks", cell: ({ row }) => row.original.ducks_ratio.toFixed(1) },
	thirties: { accessorKey: "thirties", header: "30s" },
	fifties: { accessorKey: "fifties", header: "50s" },
};

const filterColumns: Record<Filter, ColumnDef<BattingStats>[]> = {
	"most-runs": [columns.innings, columns.balls, columns.runs],
	"best-strike-rate": [columns.runs, columns.balls, columns.strike_rate],
	"best-average": [columns.runs, columns.innings, columns.not_outs, columns.average],
	"most-not-outs": [columns.innings, { ...columns.not_outs, header: "Not-Outs" }],
	"highest-score": [columns.highest_score],
	"most-fours": [columns.balls, columns.fours],
	"most-sixes": [columns.balls, columns.sixes],
	"most-ducks": [columns.innings, { ...columns.ducks, header: "Ducks" }],
	"most-thirties": [columns.innings, columns.thirties],
	"most-fifties": [columns.innings, columns.fifties],
	"four-ratio": [columns.fours_ratio],
	"six-ratio": [columns.six_ratio],
	"duck-ratio": [columns.ducks_ratio],
};

const getBattingColumns = (): ColumnDef<BattingStats>[] => {
	const isMobile = useIsMobile();
	const { filter } = Route.useSearch();

	if (filter && filter in filterColumns) {
		return filterColumns[filter];
	}

	if (isMobile) {
		return [columns.innings, columns.runs, columns.balls, columns.strike_rate, columns.average];
	}

	return [
		columns.innings,
		columns.runs,
		columns.balls,
		columns.not_outs,
		columns.strike_rate,
		columns.average,
		columns.highest_score,
		columns.fours,
		columns.sixes,
		columns.ducks,
		columns.thirties,
		columns.fifties,
	];
};

const getBattingSorting = (filter?: Filter) => {
	if (!filter) return [{ id: "runs", desc: true }];
	switch (filter) {
		case "most-runs":
			return [{ id: "runs", desc: true }];
		case "best-strike-rate":
			return [{ id: "strike_rate", desc: true }];
		case "best-average":
			return [{ id: "average", desc: true }];
		case "most-not-outs":
			return [{ id: "not_outs", desc: true }];
		case "highest-score":
			return [{ id: "highest_score", desc: true }];
		case "most-fours":
			return [{ id: "fours", desc: true }];
		case "most-sixes":
			return [{ id: "sixes", desc: true }];
		case "most-ducks":
			return [{ id: "ducks", desc: true }];
		case "most-thirties":
			return [{ id: "thirties", desc: true }];
		case "most-fifties":
			return [{ id: "fifties", desc: true }];
		case "four-ratio":
			return [{ id: "fours_ratio", desc: false }];
		case "six-ratio":
			return [{ id: "six_ratio", desc: false }];
		case "duck-ratio":
			return [{ id: "ducks_ratio", desc: false }];
		default:
			return [{ id: "runs", desc: true }];
	}
};

export const Route = createFileRoute("/_stats/stats/batting")({
	head: () => ({ meta: [{ title: "Batting Stats" }] }),
	validateSearch: z.object({ filter: filterSchema }),
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) =>
		await context.queryClient.ensureQueryData({
			queryKey: ["batting-stats", deps.date ?? deps.rivalry ?? "all-time"],
			queryFn: () => getBattingStats({ data: deps }),
		}),
	component: () => {
		const data = Route.useLoaderData();
		const navigate = Route.useNavigate();
		const { filter } = Route.useSearch();
		const sorting = useMemo(() => getBattingSorting(filter), [filter]);
		return (
			<TabsLayout
				title="Batting Stats"
				filters={{
					value: filter,
					icon: FilterIcon,
					title: "Select Filters",
					onValueChange: (val) => {
						const value = filterSchema.parse(val);
						navigate({ search: (prev) => ({ ...prev, filter: value }) });
					},
					options: [{ value: "", label: "All Stats" }, ...filters.map((filter) => ({ value: filter, label: filter }))],
				}}
			>
				<DataTable data={data} columns={[columns.player, ...getBattingColumns()]} sorting={sorting} />
			</TabsLayout>
		);
	},
});
