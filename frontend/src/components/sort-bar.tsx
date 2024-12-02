import { cx } from "@/lib/utils";
import type { OrderBy, SortBy } from "@/shared/types";
import { useNavigate } from "@tanstack/react-router";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function SortBar({
  sortBy,
  orderBy,
}: {
  sortBy: SortBy;
  orderBy: OrderBy;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between gap-2">
      <Select
        value={sortBy}
        onValueChange={(sortBy: SortBy) =>
          navigate({ to: ".", search: (prev: any) => ({ ...prev, sortBy }) })
        }
      >
        <SelectTrigger
          className="w-[180px] bg-background"
          aria-label={sortBy === "points" ? "Sort by Points" : "Sort by Recent"}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="points">Points</SelectItem>
          <SelectItem value="recent">Recent</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="icon"
        variant="outline"
        onClick={() =>
          navigate({
            to: ".",
            search: (prev: any) => ({
              ...prev,
              orderBy: orderBy === "asc" ? "desc" : "asc",
            }),
          })
        }
        aria-label={orderBy === "desc" ? "Sort Descending" : "Sort Ascending"}
      >
        <ArrowUpIcon
          className={cx(
            "transition-transform duration-300",
            orderBy === "desc" ? "rotate-180" : "",
          )}
        />
      </Button>
    </div>
  );
}
