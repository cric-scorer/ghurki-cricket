import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "@tanstack/react-router";

import { PlayerAvatar } from "@/components/players/avatar";
import { playerQueryOptions } from "@/components/players/query";
import { tabItems, statsItems } from "@/components/tabs-layout";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
export function AppSidebar() {
	const { pathname } = useLocation();
	const { date, rivalry } = useSearch({ strict: false });
	const { data: players } = useSuspenseQuery(playerQueryOptions());
	return (
		<Sidebar className="gap-0">
			<SidebarHeader className="px-4 py-3">
				<h1 className="text-center text-xl/9 font-semibold">Ghurki Cricket Club</h1>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Pages</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{tabItems.map((item) => (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton isActive={pathname.endsWith(item.url)} asChild>
										<Link to={item.url}>
											<img src={item.icon} width={14} height={14} alt={item.name} className="aspect-square" />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Stats</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{statsItems.map((item) => (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton isActive={pathname.endsWith(item.url)} asChild>
										<Link to={item.url} search={{ date, rivalry }}>
											<img src={item.icon} width={14} height={14} alt={item.name} className="aspect-square" />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupLabel>Players</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{players.map((item) => (
								<SidebarMenuItem key={item.name}>
									<SidebarMenuButton isActive={pathname.endsWith(item.name)} asChild>
										<Link to="/players/$playerId" params={{ playerId: item.name }}>
											<PlayerAvatar name={item.name} area={20} className="size-5" />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
