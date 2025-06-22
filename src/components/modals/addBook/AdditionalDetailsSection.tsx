import React, { useEffect } from 'react';

import {
  ChevronDown,
  Search,
  X,
  BookOpen,
  Shield,
  Hash,
  Check,
} from 'lucide-react';

interface GenreOption {
  value: string;
  label: string;
}

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

interface AdditionalDetailsSectionProps {
  book: BookState;
  setBook: React.Dispatch<React.SetStateAction<BookState>>;
  filteredGenres: GenreOption[];
  genreDropdownRef: React.RefObject<HTMLDivElement | null>; // ✅ Allow null
  isGenreDropdownOpen: boolean;
  setIsGenreDropdownOpen: (open: boolean) => void;
  genreSearch: string;
  setGenreSearch: (value: string) => void;
  onGenreSelect: (value: string) => void;
  onGenreRemove: (value: string) => void;
  getGenreLabel: (value: string) => string;
}

export default function AdditionalDetailsSection({
  book,
  setBook,
  filteredGenres,
  genreDropdownRef,
  isGenreDropdownOpen,
  setIsGenreDropdownOpen,
  genreSearch,
  setGenreSearch,
  onGenreSelect,
  onGenreRemove,
  getGenreLabel,
}: AdditionalDetailsSectionProps) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        genreDropdownRef.current &&
        !genreDropdownRef.current.contains(event.target as Node)
      ) {
        setIsGenreDropdownOpen(false);
        setGenreSearch('');
      }
    };

    if (isGenreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isGenreDropdownOpen, genreDropdownRef, setIsGenreDropdownOpen, setGenreSearch]);

  const ageRatingOptions = [
    { value: '', label: 'Select Age Rating' },
    { value: 'all-ages', label: 'All Ages', description: 'Suitable for everyone' },
    { value: 'children', label: 'Children (0-12)', description: 'Designed for young readers' },
    { value: 'teen', label: 'Teen (13-17)', description: 'Young adult content' },
    { value: 'adult', label: 'Adult (18+)', description: 'Mature content' },
  ];

  const validateISBN = (isbn: string) => {
    const clean = isbn.replace(/[-\s]/g, '');
    return clean.length === 10 || clean.length === 13;
  };

  const formatISBN = (isbn: string) => {
    const clean = isbn.replace(/[-\s]/g, '');
    if (clean.length === 13) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 12)}-${clean.slice(12)}`;
    } else if (clean.length === 10) {
      return `${clean.slice(0, 1)}-${clean.slice(1, 6)}-${clean.slice(6, 9)}-${clean.slice(9)}`;
    }
    return isbn;
  };

  const isISBNValid = validateISBN(book.isbn);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 mb-6 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
          <p className="text-sm text-gray-600">Complete your book&apos;s metadata and specifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Genre Dropdown */}
        <div className="relative">
          <div className="space-y-2">
            <div ref={genreDropdownRef}>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  Genre
                  {book.genre.length > 0 && (
                    <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                      {book.genre.length}
                    </span>
                  )}
                </div>
              </label>
              <button
                type="button"
                onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all bg-white hover:bg-gray-50 text-left flex items-center justify-between group"
              >
                <span className={book.genre.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                  {book.genre.length > 0
                    ? `${book.genre.length} genre${book.genre.length > 1 ? 's' : ''} selected`
                    : 'Select genres'}
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-all ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Genre Tags */}
              {book.genre.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {book.genre.map((value) => (
                    <span
                      key={value}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
                    >
                      {getGenreLabel(value)}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onGenreRemove(value);
                        }}
                        className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {isGenreDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                {/* Search */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search genres..."
                      value={genreSearch}
                      onChange={(e) => setGenreSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Genre Options */}
                <div className="max-h-56 overflow-y-auto">
                  {filteredGenres.length > 0 ? (
                    filteredGenres.map((genre) => {
                      const isSelected = book.genre.includes(genre.value);
                      return (
                        <button
                          key={genre.value}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onGenreSelect(genre.value);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                            isSelected
                              ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-500'
                              : 'hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                          }`}
                        >
                          <span className={isSelected ? 'font-medium' : ''}>{genre.label}</span>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-purple-600">Selected</span>
                              <Check className="h-4 w-4 text-purple-600" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-sm text-gray-500 text-center">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No genres found
                    </div>
                  )}
                </div>

                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => setIsGenreDropdownOpen(false)}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Age Rating */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-500" />
              Age Rating
            </div>
          </label>
          <div className="relative">
            <select
              value={book.rated}
              onChange={(e) => setBook({ ...book, rated: e.target.value })}
              className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all bg-white hover:bg-gray-50 appearance-none font-medium text-gray-900"
              required
              aria-label="Age Rating"
            >
              {ageRatingOptions.map((option) => (
                <option key={option.value} value={option.value} disabled={option.value === ''}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          </div>
          {book.rated && (
            <div className="text-xs text-gray-600 mt-1">
              {ageRatingOptions.find((opt) => opt.value === book.rated)?.description}
            </div>
          )}
        </div>

        {/* ISBN Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-gray-500" />
              ISBN
            </div>
          </label>
          <div className="relative">
            <input
              type="text"
              value={book.isbn}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d\-]/g, '');
                setBook({ ...book, isbn: value });
              }}
              placeholder="Enter ISBN-10 or ISBN-13"
              className={`w-full rounded-lg border-2 px-4 py-3 focus:ring-2 transition-all bg-white font-mono text-sm ${
                book.isbn && !isISBNValid
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                  : book.isbn && isISBNValid
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                  : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/20'
              }`}
              aria-label="ISBN"
            />
            {book.isbn && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isISBNValid ? (
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="h-3 w-3 text-red-600" />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            {book.isbn && isISBNValid && (
              <div className="text-green-600 font-medium">✓ Valid ISBN format: {formatISBN(book.isbn)}</div>
            )}
            {book.isbn && !isISBNValid && (
              <div className="text-red-600">✗ Invalid ISBN format. Must be 10 or 13 digits.</div>
            )}
            {!book.isbn && <div>International Standard Book Number (10 or 13 digits)</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
