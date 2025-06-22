import React from 'react';
import { ChevronDown, Search, X, Tag, Globe, FileText, Check } from 'lucide-react';

// Add types for dropdown config
interface Option {
  value: string;
  label: string;
}

type DropdownType = 'category' | 'language' | 'format';

interface BookState {
  category: string[];
  language: string[];
  format: string[];
  name: string;
  description: string;
  qty: string;
  sellingPrice: string;
  normalPrice: string;
  genre: string[];
  rated: string;
  isbn: string;
  publisher: string;
  referralCommission: number;
}

interface DropdownConfig {
  key: DropdownType;
  label: string;
  icon: React.ElementType;
  placeholder: string;
  emptyMessage: string;
  options: Option[];
  values: string[];
  searchValue: string;
}

interface ClassificationSectionProps {
  book: BookState;
  setBook: React.Dispatch<React.SetStateAction<BookState>>;
  filteredOptions: {
    categories: { value: string; label: string }[];
    languages: { value: string; label: string }[];
    formats: { value: string; label: string }[];
  };
  dropdownRefs: {
    category: React.RefObject<HTMLDivElement | null>;
    genre: React.RefObject<HTMLDivElement | null>;
    language: React.RefObject<HTMLDivElement | null>;
    format: React.RefObject<HTMLDivElement | null>;
  };
  dropdownStates: {
    category: boolean;
    genre: boolean;
    language: boolean;
    format: boolean;
  };
  setDropdownStates: React.Dispatch<React.SetStateAction<{
    category: boolean;
    genre: boolean;
    language: boolean;
    format: boolean;
  }>>;
  searchStates: {
    category: string;
    genre: string;
    language: string;
    format: string;
  };
  setSearchStates: React.Dispatch<React.SetStateAction<{
    category: string;
    genre: string;
    language: string;
    format: string;
  }>>;
  onSelection: (type: 'category' | 'language' | 'format', value: string) => void;
  onRemoval: (type: 'category' | 'language' | 'format', value: string) => void;
  getLabelByValue: (value: string, type: 'category' | 'language' | 'format') => string;
}

const ClassificationSection: React.FC<ClassificationSectionProps> = ({
  book,
  setBook,
  filteredOptions,
  dropdownRefs,
  dropdownStates,
  setDropdownStates,
  searchStates,
  setSearchStates,
  onSelection,
  onRemoval,
  getLabelByValue,
}) => {
  const dropdownConfig: DropdownConfig[] = [
    {
      key: 'category',
      label: 'Category',
      icon: Tag,
      placeholder: 'Search categories...',
      emptyMessage: 'No categories found',
      options: filteredOptions.categories,
      values: book.category,
      searchValue: searchStates.category,
    },
    {
      key: 'language',
      label: 'Language',
      icon: Globe,
      placeholder: 'Search languages...',
      emptyMessage: 'No languages found',
      options: filteredOptions.languages,
      values: book.language,
      searchValue: searchStates.language,
    },
    {
      key: 'format',
      label: 'Format',
      icon: FileText,
      placeholder: 'Search formats...',
      emptyMessage: 'No formats found',
      options: filteredOptions.formats,
      values: book.format,
      searchValue: searchStates.format,
    },
  ];

  const renderSelectedTags = (values: string[], type: DropdownType) => {
    if (!values || values.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {values.map((value: string) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
          >
            {getLabelByValue(value, type)}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoval(type, value);
              }}
              className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    );
  };

  const renderDropdown = (config: DropdownConfig) => {
    const isOpen = dropdownStates[config.key];
    const IconComponent = config.icon;
    const selectedCount = config.values.length;
    return (
      <div key={config.key} className="relative">
        <div className="space-y-2">
          <div ref={dropdownRefs[config.key]}>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4 text-gray-500" />
                {config.label}
                {selectedCount > 0 && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                    {selectedCount}
                  </span>
                )}
              </div>
            </label>
            <button
              type="button"
              onClick={() => setDropdownStates(prev => ({
                ...prev,
                [config.key]: !prev[config.key]
              }))}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white hover:bg-gray-50 text-left flex items-center justify-between group"
            >
              <span className={selectedCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {selectedCount > 0
                  ? config.values
                      .map(val => getLabelByValue(val, config.key))
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(', ') +
                    (selectedCount > 2 ? ` +${selectedCount - 2} more` : '')
                  : `Select ${config.label.toLowerCase()}`
                }
              </span>
              <ChevronDown className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {renderSelectedTags(config.values, config.key)}
          </div>
          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={config.placeholder}
                    value={config.searchValue}
                    onChange={(e) => setSearchStates(prev => ({
                      ...prev,
                      [config.key]: e.target.value
                    }))}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                </div>
                {selectedCount > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    {selectedCount} selected • Click items to add/remove
                  </div>
                )}
              </div>
              {/* Options List */}
              <div className="max-h-56 overflow-y-auto">
                {config.options.length > 0 ? (
                  config.options.map((option: Option) => {
                    const isSelected = config.values.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelection(config.key, option.value);
                          setSearchStates(prev => ({
                            ...prev,
                            [config.key]: ''
                          }));
                        }}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between group ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500'
                            : 'hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                        }`}
                      >
                        <span className={isSelected ? 'font-medium' : 'group-hover:font-medium'}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-indigo-600">Selected</span>
                            <Check className="h-4 w-4 text-indigo-600" />
                          </div>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-500 text-center">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    {config.emptyMessage}
                  </div>
                )}
              </div>
              {/* Close dropdown button */}
              <div className="p-3 border-t border-gray-100 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setDropdownStates(prev => ({ ...prev, [config.key]: false }))}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-1"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Tag className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Book Classification</h3>
          <p className="text-sm text-gray-600">Organize your book with categories, language, and format</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {dropdownConfig.map(renderDropdown)}
      </div>
    </div>
  );
};

export default ClassificationSection;