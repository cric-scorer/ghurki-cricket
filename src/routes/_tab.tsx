import { createFileRoute } from "@tanstack/react-router";
import { Outlet } from "@tanstack/react-router";

import { Footer } from "@/components/tabs-layout";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_tab")({
	component: () => (
		<>
			<Outlet />
			<Footer />
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
