import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { datesQueryOptions } from "@/components/date-filter";
import { playerQueryOptions } from "@/components/players/query";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MenuProvider } from "@/context/menu-context";

import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ title: "Ghurki Cricket" },
			{ name: "description", content: "Comprehensive cricket stats, match scoring, and player management for Ghurki Cricket" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: "Ghurki Cricket" },
			{ property: "og:site_name", content: "Ghurki Cricket" },
			{ property: "og:url", content: "https://stats.alihamas.pk" },
			{ property: "og:image", content: "https://stats.alihamas.pk/og-image.png" },
			{ property: "og:description", content: "Track cricket matches, player stats, and team performance." },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: "Ghurki Cricket" },
			{ name: "twitter:url", content: "https://stats.alihamas.pk" },
			{ name: "twitter:image", content: "https://stats.alihamas.pk/og-image.png" },
			{ name: "twitter:description", content: "Track cricket matches, player stats, and team performance." },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.ico" },
			{ rel: "canonical", href: "https://stats.alihamas.pk" },
		],
		scripts: [
			{ src: "https://www.googletagmanager.com/gtag/js?id=G-M5LYMCJYDX", async: true },
			{
				children: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-M5LYMCJYDX');
        `,
			},
		],
	}),
	loader: async ({ context }) =>
		await Promise.all([
			context.queryClient.ensureQueryData(playerQueryOptions()),
			context.queryClient.ensureQueryData(datesQueryOptions()),
		]),
	shellComponent: ({ children }: { children: React.ReactNode }) => {
		const { queryClient } = Route.useRouteContext();
		return (
			<html lang="en">
				<head>
					<HeadContent />
				</head>
				<SidebarProvider>
					<QueryClientProvider client={queryClient}>
						<MenuProvider>
							<AppSidebar />
							<SidebarInset>{children}</SidebarInset>
						</MenuProvider>
					</QueryClientProvider>
					<Scripts />
				</SidebarProvider>
			</html>
		);
	},
	pendingComponent: () => {
		return (
			<main className="flex min-h-dvh w-full items-center justify-center">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 495 495.839" width="64" height="64" className="fill-foreground">
					<path d="M88.402 15.96a17.317 17.317 0 00-6.27-11.898A17.65 17.65 0 0069.177.083L16.449 5.035a17.589 17.589 0 00-11.96 6.278A17.59 17.59 0 00.495 24.215l2.488 26.367 87.914-8.234zm42.082 476.946a8.728 8.728 0 002.258-6.777l-8.828-93.742c-39.836-49.645-46.285-118.25-16.39-174.45L92.604 59.922 4.691 68.16l39.575 419.688a8.829 8.829 0 008.824 7.992h70.906a8.707 8.707 0 006.488-2.934zm72.446-352.633a158.472 158.472 0 0188.277-.273l.625-76.758h-88.273zm0 0" />
					<path d="M227.605 374.566c-53.714-53.328-73.042-132.238-50.054-204.351a140.636 140.636 0 00-19.324 13.18c-1.29 4.671-2.504 9.367-3.45 14.035a8.828 8.828 0 01-10.41 6.886 8.52 8.52 0 01-4.535-2.648C104.375 243.547 96.402 302.18 119.395 352c22.992 49.824 72.777 81.805 127.648 82a8.526 8.526 0 01.883-5.215 8.832 8.832 0 015.277-4.223 8.837 8.837 0 016.719.754c4.148 2.293 8.484 4.414 12.828 6.391a139.44 139.44 0 0030.984-9.324 201.838 201.838 0 01-76.129-47.817zm-91.808-98.05a231.219 231.219 0 01-2.938-36.723v-4.66a9.147 9.147 0 019.004-8.653 8.825 8.825 0 016.192 2.715 8.815 8.815 0 012.457 6.301v4.297c.008 11.36.914 22.695 2.718 33.91.774 4.809-2.496 9.34-7.308 10.113a8.658 8.658 0 01-1.422.118 8.83 8.83 0 01-8.703-7.418zm39.723 81.09a8.704 8.704 0 01-4.41 1.175 8.822 8.822 0 01-7.665-4.414 229.12 229.12 0 01-17.347-37.676 8.834 8.834 0 015.406-11.171 8.83 8.83 0 0111.234 5.273 210.703 210.703 0 0016.024 34.746 8.829 8.829 0 01-3.258 12.066zm53.796 58.546a8.826 8.826 0 01-12.421 1.207 229.074 229.074 0 01-16.817-15.254c-4.41-4.367-8.676-9.027-12.746-13.82-3.156-3.719-2.703-9.293 1.016-12.45s9.289-2.702 12.445 1.017c3.762 4.414 7.719 8.73 11.762 12.765a221.229 221.229 0 0015.55 14.125c3.754 3.098 4.286 8.653 1.196 12.41zm0 0" />
					<path d="M347.086 377.645c3.855.804 7.875 1.308 11.871 1.835a141.128 141.128 0 0024.945-123.71 141.142 141.142 0 00-83.984-94.208h-.05a8.594 8.594 0 01-5.005-1.808 141.145 141.145 0 00-47.246-8.234c-3.39 0-6.746.253-10.09.492-1.765 3.593-3.53 7.187-5.05 10.86a8.832 8.832 0 01-6.946 5.448 8.846 8.846 0 01-8.195-3.293 8.836 8.836 0 01-1.242-8.742c.168-.422.37-.828.547-1.254a139.985 139.985 0 00-16.551 4.82 184.943 184.943 0 005.265 154.145 184.95 184.95 0 00120.27 96.559 142.065 142.065 0 0019.094-15.395c-.414-.09-.883-.113-1.27-.203a8.827 8.827 0 01-4.953-14.629 8.83 8.83 0 018.563-2.648zM203.476 223.19v-1.05a179.367 179.367 0 013.055-33.024c.903-4.793 5.516-7.949 10.309-7.05 4.793.898 7.95 5.515 7.047 10.304a161.58 161.58 0 00-2.754 29.77 9.19 9.19 0 01-8.703 9.355h-.125a8.493 8.493 0 01-8.828-8.305zm24.907 71.336c-4.504 1.86-9.664-.277-11.531-4.777a174.322 174.322 0 01-9.93-32.664 8.82 8.82 0 016.926-10.363 8.825 8.825 0 0110.382 6.894c2.012 10.067 5 19.914 8.926 29.399 1.852 4.496-.285 9.644-4.773 11.511zm38.652 51.887c-3.465 3.426-9.05 3.395-12.48-.07a179.028 179.028 0 01-21.594-26.43 8.833 8.833 0 01-.902-9.039 8.83 8.83 0 0115.559-.77 161.35 161.35 0 0019.417 23.836 8.825 8.825 0 010 12.473zm55.29 33.543a8.826 8.826 0 01-11.59 4.652 175.449 175.449 0 01-29.97-16.418 8.828 8.828 0 01-1.769-11.886 8.83 8.83 0 0111.727-2.633 156.67 156.67 0 0026.949 14.765 8.827 8.827 0 014.652 11.555zm0 0" />
					<path d="M387.738 217.902c29.922 56.22 23.469 124.86-16.402 174.52l-8.871 93.707a8.811 8.811 0 002.27 6.789 8.81 8.81 0 006.554 2.875h70.906a8.827 8.827 0 008.828-7.996L490.56 68.168l-87.903-8.234zM478.785 5.035L426.06.09c-4.664-.465-9.32.95-12.938 3.933a17.576 17.576 0 00-6.309 11.957l-2.496 26.41 87.903 8.239 2.5-26.387c.875-9.672-6.227-18.234-15.89-19.164zM271.398 449.707a153.804 153.804 0 01-67.921-4.328v41.59c0 4.875 3.953 8.824 8.828 8.824h70.62c4.876 0 8.829-3.95 8.829-8.824v-41.59a157.388 157.388 0 01-17.734 3.937c-.832.262-1.7.395-2.57.399zM292.18 19.465A17.66 17.66 0 00274.664 1.66L221.7 1.246h-.152c-9.692 0-17.57 7.813-17.652 17.504l-.204 26.836h88.274zm0 0" />
				</svg>
			</main>
		);
	},
});
