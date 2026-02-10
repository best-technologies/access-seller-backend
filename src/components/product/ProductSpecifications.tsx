import React from "react";

interface ProductSpecificationsProps {
  specifications: Record<string, string>;
}

export default function ProductSpecifications({ specifications }: ProductSpecificationsProps) {
  // Custom logic for each field
  const fields = [
    {
      key: 'Publisher',
      label: 'Publisher',
      show: true,
      value: specifications.Publisher && specifications.Publisher.trim() !== '' ? specifications.Publisher : 'Accessible publishers',
    },
    {
      key: 'ISBN',
      label: 'ISBN',
      show: !!(specifications.ISBN && specifications.ISBN.trim() !== ''),
      value: specifications.ISBN,
    },
    {
      key: 'Language',
      label: 'Language',
      show: true,
      value: specifications.Language && specifications.Language.trim() !== '' ? specifications.Language : 'English',
    },
    {
      key: 'Genre',
      label: 'Genre',
      show: !!(specifications.Genre && specifications.Genre.trim() !== ''),
      value: specifications.Genre,
    },
    {
      key: 'Format',
      label: 'Format',
      show: !!(specifications.Format && specifications.Format.trim() !== ''),
      value: specifications.Format,
    },
    {
      key: 'Commission Rate',
      label: 'Commission Rate',
      show: !!(specifications['Commission Rate'] && specifications['Commission Rate'].trim() !== ''),
      value: specifications['Commission Rate'],
    },
    {
      key: 'Stock',
      label: 'Stock',
      show: !!(specifications.Stock && specifications.Stock.trim() !== ''),
      value: specifications.Stock,
    },
  ];

  return (
    <div className="space-y-3">
      {fields.filter(f => f.show).map(({ key, label, value }) => (
        <div key={key} className="flex flex-col sm:flex-row py-2 border-b border-gray-100 last:border-b-0">
          <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0 sm:w-1/3">{label}</span>
          <span className="text-sm text-gray-900 sm:w-2/3">{value}</span>
        </div>
      ))}
    </div>
  );
} 