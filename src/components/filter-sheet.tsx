import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetTrigger, SheetContent, SheetHeader } from "@/components/ui/sheet";

export type FilterSheetProps = {
	icon?: IconSvgElement;
	title?: string;
	value?: string;
	onValueChange?: (value: string | number) => void;
	options: {
		value: string;
		label: string;
	}[];
};

export function FilterSheet({ title, icon, options, value = "", onValueChange }: FilterSheetProps) {
	const [open, setOpen] = useState(false);
	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" className="capitalize">
					{icon && <HugeiconsIcon icon={icon} />}
					{value.split("-").join(" ") || options[0].label}
				</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader title={title ?? "Select Option"} />
				<div className="p-4">
					<RadioGroup
						value={value}
						onValueChange={(value) => {
							onValueChange?.(value);
							setOpen(false);
						}}
					>
						{options.map((option) => {
							return (
								<RadioGroupItem key={option.value} value={option.value} className="md:text-[15px]">
									{option.label.split("-").join(" ")}
								</RadioGroupItem>
							);
						})}
					</RadioGroup>
				</div>
			</SheetContent>
		</Sheet>
	);
}
