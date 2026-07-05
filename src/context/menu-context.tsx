import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createContext, use, useEffect, useState } from "react";

import { PlayerAvatar } from "@/components/players/avatar";
import { playerQueryOptions } from "@/components/players/query";
import { tabItems, statsItems } from "@/components/tabs-layout";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

type MenuProps = {
	isOpen: boolean;
	toggleOpen: () => void;
};

const MenuContext = createContext<MenuProps>({
	isOpen: false,
	toggleOpen: () => {},
});

function Menu({ isOpen, toggleOpen }: MenuProps) {
	const navigate = useNavigate();
	const { data: players } = useSuspenseQuery(playerQueryOptions());

	const handleSelect = (value: string) => {
		navigate({ to: value });
		toggleOpen();
	};

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleOpen();
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [toggleOpen]);

	return (
		<CommandDialog open={isOpen} onOpenChange={toggleOpen}>
			<Command className="">
				<CommandInput placeholder="Search pages, players and stats..." />
				<CommandList>
					<CommandEmpty>No results found.</CommandEmpty>
					<CommandGroup heading="Pages">
						{tabItems.map((item) => (
							<CommandItem key={item.name} onSelect={() => handleSelect(item.url)}>
								<img src={item.icon} width={14} height={14} alt={item.name} className="aspect-square" />
								<span>{item.name}</span>
							</CommandItem>
						))}
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Stats">
						{statsItems.map((item) => (
							<CommandItem key={item.name} onSelect={() => handleSelect(item.url)}>
								<img src={item.icon} width={14} height={14} alt={item.name} className="aspect-square" />
								<span>{`${item.name} Stats`}</span>
							</CommandItem>
						))}
					</CommandGroup>
					<CommandSeparator />
					<CommandGroup heading="Players">
						{players.map((player) => (
							<CommandItem key={player.name} onSelect={() => handleSelect(`/players/${player.name}`)}>
								<PlayerAvatar name={player.name} className="size-5" />
								<span>{player.name}</span>
							</CommandItem>
						))}
					</CommandGroup>
				</CommandList>
			</Command>
		</CommandDialog>
	);
}

export function MenuProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const toggleOpen = () => setIsOpen((prev) => !prev);
	return (
		<MenuContext.Provider value={{ isOpen, toggleOpen }}>
			{children}
			<Menu isOpen={isOpen} toggleOpen={toggleOpen} />
		</MenuContext.Provider>
	);
}

export function useMenu() {
	return use(MenuContext);
}
