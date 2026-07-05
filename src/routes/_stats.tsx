import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

import { dateSearchSchema } from "@/components/date-filter";
import { Footer } from "@/components/tabs-layout";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_stats")({
	validateSearch: dateSearchSchema,
	component: () => (
		<>
			<Outlet />
			<Footer forStats />
		</>
	),
	pendingComponent: () => {
		return (
			<main className="my-4 flex justify-center">
				<Spinner />
			</main>
		);
	},
});
