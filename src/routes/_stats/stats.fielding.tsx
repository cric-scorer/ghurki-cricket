import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { type ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table";
import { validateDate } from "@/components/date-filter";
import { PlayerAvatarCell } from "@/components/players/avatar";
import { TabsLayout } from "@/components/tabs-layout";
import { db } from "@/lib/db";
import { type FieldingStats } from "@/lib/types";

const getFieldingStats = createServerFn({ method: "GET" })
	.validator(validateDate)
	.handler(async ({ data }): Promise<FieldingStats[]> => {
		const stats = await db.fielders.groupBy({
			by: ["playerId"],
			where: { date: data },
			orderBy: { _sum: { catches: "desc" } },
			_sum: { innings: true, catches: true, runOuts: true },
		});
		return stats.map(({ playerId, _sum }) => ({
			player: playerId,
			innings: _sum.innings,
			catches: _sum.catches,
			runOuts: _sum.runOuts,
		}));
	});

const columns: ColumnDef<FieldingStats>[] = [
	{ accessorKey: "player", header: "Player", cell: ({ row }) => <PlayerAvatarCell name={row.original.player} /> },
	{ accessorKey: "innings", header: "Innings" },
	{ accessorKey: "catches", header: "Catches" },
	{ accessorKey: "runOuts", header: "Run Outs" },
];

export const Route = createFileRoute("/_stats/stats/fielding")({
	head: () => ({ meta: [{ title: "Fielding Stats" }] }),
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) =>
		await context.queryClient.ensureQueryData({
			queryKey: ["fielding-stats", deps.date ?? deps.rivalry ?? "all-time"],
			queryFn: () => getFieldingStats({ data: deps }),
		}),
	component: () => {
		const data = Route.useLoaderData();
		return (
			<TabsLayout title="Fielding Stats">
				<DataTable columns={columns} data={data} />
			</TabsLayout>
		);
	},
});
