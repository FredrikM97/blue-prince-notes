import { memo } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/common/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/common/DropdownMenu";
import { cn } from "@/lib/utils";

export interface DropdownSelectOption {
  value: string;
  label: string;
}

export function DropdownSelectComponent({
  value,
  onValueChange,
  options,
  placeholder = "Select...",
  className,
  contentClassName,
}: {
  value: string;
  onValueChange: (next: string) => void;
  options: DropdownSelectOption[];
  placeholder?: string;
  className?: string;
  contentClassName?: string;
}) {
  const activeOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-between bg-card/65 px-3 py-2 text-sm font-normal",
            className,
          )}
        >
          <span className={activeOption ? "text-foreground" : "text-muted-foreground"}>
            {activeOption?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className={cn("w-[var(--radix-dropdown-menu-trigger-width)]", contentClassName)}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={option.value === value ? "bg-accent" : undefined}
            onSelect={() => onValueChange(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const DropdownSelect = memo(DropdownSelectComponent);