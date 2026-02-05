"use client";

import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "flowbite-react";
import PaginationComp from "@/app/components/PaginationComp";

type PaginatedData<T> = {
  count: number;
  results: T[];
  next: string;
  previous: string;
};

type PaginationReaderProps<T extends { id: number }> = {
  title: string;
  paginationData: PaginatedData<T>;
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  show: boolean;
  onClose: () => void;
  onPageChange: (url: string | null) => void;
};

export default function PaginationReader<T extends { id: number }>({
  title,
  paginationData,
  renderItem,
  onSelect,
  show,
  onClose,
  onPageChange,
}: PaginationReaderProps<T>) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>
        <span className="text-2xl font-bold">{title}</span>
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
          <PaginationComp
            totalItems={paginationData.count}
            next={paginationData.next}
            previous={paginationData.previous}
            onPageChange={onPageChange}
          />
        </div>
      </ModalBody>
      <ModalFooter>
        <Button onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}
