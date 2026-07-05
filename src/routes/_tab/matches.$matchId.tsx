import { createFileRoute, notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { TabsLayout } from "@/components/tabs-layout";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const getMatchById = createServerFn({ method: "GET" })
	.validator(z.object({ id: z.string() }))
	.handler(async ({ data }) => {
		const match = await db.matches.findUnique({ where: { id: Number(data.id) } });
		if (!match) throw notFound();
		const dateId = formatDate(match.dateId);
		const baseUrl = "https://ikugfeiiqjczdqccfzoe.supabase.co";
		const matchId = match.title.split(" ").join("_").toLowerCase();
		const scorecardUrl = `${baseUrl}/storage/v1/object/public/scorecards/${formatDate(match.dateId, "numeric")}/${matchId}.jpeg`;
		return { ...match, dateId, scorecardUrl, fullTitle: `${match.title} (${dateId})` };
	});

export const Route = createFileRoute("/_tab/matches/$matchId")({
	loader: async ({ context, params }) =>
		await context.queryClient.ensureQueryData({
			queryKey: ["match", params.matchId],
			queryFn: () => getMatchById({ data: { id: params.matchId } }),
		}),
	head: ({ loaderData }) => ({
		meta: [{ title: loaderData?.fullTitle ?? "Match not found" }],
	}),
	component: () => {
		const data = Route.useLoaderData();
		return (
			<TabsLayout title={data.fullTitle} dateFilter={null}>
				{data.scorecardUrl && (
					<AspectRatio ratio={16 / 9} className="w-full overflow-hidden rounded-md bg-muted md:rounded-lg">
						<img src={data.scorecardUrl} alt={data.fullTitle} className="h-auto w-full object-cover" />
					</AspectRatio>
				)}
			</TabsLayout>
		);
	},
});
