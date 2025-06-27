import React from "react";

interface ProductSpecificationsProps {
  specifications: Record<string, string>;
}

export default function ProductSpecifications({ specifications }: ProductSpecificationsProps) {
  return (
    <div className="space-y-3">
      {Object.entries(specifications ?? {}).map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row py-2 border-b border-gray-100 last:border-b-0">
          <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0 sm:w-1/3">{key}</span>
          <span className="text-sm text-gray-900 sm:w-2/3">{value}</span>
        </div>
      ))}
    </div>
  );
} 