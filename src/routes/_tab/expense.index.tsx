import type { ColumnDef } from "@tanstack/react-table";

import { CalendarIcon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { z } from "zod";

import { DataTable } from "@/components/data-table";
import { TabsLayout } from "@/components/tabs-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const yearSchema = z.object({
	year: z.number().optional(),
});

const getExpense = createServerFn({ method: "GET" })
	.inputValidator(yearSchema)
	.handler(async ({ data }) => {
		const expense = await db.expenses.findMany({
			orderBy: { date: "desc" },
			where: data.year ? { date: { gte: new Date(data.year, 0, 0), lte: new Date(data.year, 11, 31) } } : {},
		});

		const chatData = expense.map((item) => ({
			...item,
			date: formatDate(item.date),
			total: item.gearCost + item.groundFee,
		}));

		const tableData = Array.from(
			expense
				.reduce((grounds, item) => {
					const current = grounds.get(item.ground) ?? {
						ground: item.ground,
						expense: 0,
						days: new Set<string>(),
					};

					current.expense += item.groundFee;
					current.days.add(formatDate(item.date));
					grounds.set(item.ground, current);

					return grounds;
				}, new Map<string, { ground: string; expense: number; days: Set<string> }>())
				.values(),
			({ ground, expense, days }) => ({
				ground,
				expense,
				daysPlayed: days.size,
			}),
		);
		tableData.sort((a, b) => b.expense - a.expense);

		return { chatData, tableData };
	});

type ExpenseRow = Awaited<ReturnType<typeof getExpense>>["tableData"][number];

const columns: ColumnDef<ExpenseRow>[] = [
	{ accessorKey: "ground", header: "Ground" },
	{ accessorKey: "daysPlayed", header: "Days" },
	{ accessorKey: "expense", header: "Expense" },
];

const chartConfig: ChartConfig = {
	groundFee: { label: "Ground Fee", color: "var(--chart-1)" },
	gearCost: { label: "Gear Cost", color: "var(--chart-2)" },
	total: { label: "Total Cost", color: "var(--chart-3)" },
};

export const Route = createFileRoute("/_tab/expense/")({
	head: () => ({ meta: [{ title: "Expense" }] }),
	validateSearch: yearSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context, deps }) =>
		await context.queryClient.ensureQueryData({
			queryKey: ["expense", deps.year ?? "all-time"],
			queryFn: () => getExpense({ data: deps }),
		}),
	component: () => {
		const { year } = Route.useSearch();
		const navigate = Route.useNavigate();
		const { chatData, tableData } = Route.useLoaderData();
		const [activeChart, setActiveChart] = useState<keyof typeof chartConfig>("total");
		return (
			<TabsLayout
				title="Expense"
				dateFilter={null}
				filters={{
					icon: CalendarIcon,
					value: year?.toString(),
					onValueChange: (val) => navigate({ search: { year: val === "" ? undefined : Number(val) }, replace: true }),
					options: [
						{ label: "All Time", value: "" },
						{ label: "2026", value: "2026" },
						{ label: "2025", value: "2025" },
					],
				}}
			>
				<Card className="mt-1 min-h-100 py-0">
					<CardHeader className="grid grid-cols-2 gap-0 divide-x divide-y border-b px-0 sm:grid-cols-3 md:divide-y-0 [.border-b]:pb-0">
						{["groundFee", "gearCost", "total"].map((key) => {
							const chart = key as keyof typeof chartConfig;
							return (
								<button
									key={chart}
									type="button"
									data-active={activeChart === chart}
									onClick={() => setActiveChart(chart)}
									className="relative z-30 flex flex-1 flex-col justify-center gap-1 px-6 py-4 text-left data-[active=true]:bg-muted/70 sm:px-8 sm:py-6"
								>
									<span className="text-xs text-muted-foreground">{chartConfig[chart].label}</span>
									<span className="text-lg leading-none font-bold sm:text-3xl">
										{chatData.reduce((sum, row) => sum + (Number(row[key as keyof typeof row]) || 0), 0).toLocaleString()}
									</span>
								</button>
							);
						})}
					</CardHeader>
					<CardContent className="px-2 sm:p-6">
						<ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
							<BarChart accessibilityLayer data={[...chatData].reverse()} margin={{ left: 12, right: 12 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="date"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={32}
									tickFormatter={(value) => formatDate(value) ?? "All Time"}
								/>
								<ChartTooltip
									content={
										<ChartTooltipContent
											className="w-[150px]"
											nameKey="views"
											labelFormatter={(value) => formatDate(value) ?? "All Time"}
										/>
									}
								/>
								<Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
				<DataTable columns={columns} data={tableData} />
			</TabsLayout>
		);
	},
});
