"use client";

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";

type PaginatedData<T> = {
  count: number;
  results: T[];
  next: string;
  previous: string;
};

type PaginationModalProps<T extends { id: number }> = {
  title: string;
  paginationData: PaginatedData<T>;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  show: boolean;
  onClose: () => void;
  onPageChange: (url: string | null) => void;
};

export default function PaginationModal<T extends { id: number }>({
  title,
  paginationData,
  renderItem,
  onSelect,
  show,
  onClose,
  onPageChange,
}: PaginationModalProps<T>) {
  const hasNext = Boolean(paginationData.next?.trim());
  const hasPrevious = Boolean(paginationData.previous?.trim());
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>
        <span className="text-2xl font-bold">{title}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {paginationData.count} result{paginationData.count !== 1 ? "s" : ""}
        </span>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-2">
            {paginationData.results.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {renderItem(item)}
              </div>
            ))}
          </div>
          {paginationData.count > 10 && (
            <div className="flex gap-2 justify-center">
              <Button
                color="gray"
                outline
                disabled={!hasPrevious}
                onClick={() => onPageChange(paginationData.previous ?? null)}
              >
                Previous
              </Button>
              <Button
                color="gray"
                outline
                disabled={!hasNext}
                onClick={() => onPageChange(paginationData.next ?? null)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}
