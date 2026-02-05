"use client";

import { Button } from "flowbite-react";

type PaginationCompProps = {
  totalItems: number;
  next: string | null;
  previous: string | null;
  onPageChange: (url: string | null) => void;
  /** Optional: show "X items" label. Default true. */
  showTotal?: boolean;
};

export default function PaginationComp({
  totalItems,
  next,
  previous,
  onPageChange,
  showTotal = true,
}: PaginationCompProps) {
  const hasNext = Boolean(next?.trim());
  const hasPrevious = Boolean(previous?.trim());

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {showTotal && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {totalItems} result{totalItems !== 1 ? "s" : ""}
        </span>
      )}
      <div className="flex gap-2">
        <Button color="gray" outline disabled={!hasPrevious} onClick={() => onPageChange(previous ?? null)}>
          Previous
        </Button>
        <Button color="gray" outline disabled={!hasNext} onClick={() => onPageChange(next ?? null)}>
          Next
        </Button>
      </div>
    </div>
  );
}
