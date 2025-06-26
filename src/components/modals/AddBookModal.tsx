"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Loader2, 
  Book, 
  BookOpen, 
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import BookBasicInfoSection from './addBook/BookBasicInfoSection';
import PricingInventorySection from './addBook/PricingInventorySection';
import ClassificationSection from './addBook/ClassificationSection';
import AdditionalDetailsSection from './addBook/AdditionalDetailsSection';
import MediaPublisherSection from './addBook/MediaPublisherSection';
import { MetadataResponse } from '@/services/api';

// Enhanced Book interface with better typing
export interface Book {
  name: string;
  description: string;
  qty: string;
  sellingPrice: string;
  normalPrice: string;
  category: string[];
  language: string[];
  format: string[];
  genre: string[];
  rated: string;
  display_images?: File[];
  isbn: string;
  publisher: string;
  referralCommission: number;
}

// Validation error interface
interface ValidationErrors {
  [key: string]: string;
}

// Form state interface
interface FormState {
  isSubmitting: boolean;
  isDirty: boolean;
  errors: ValidationErrors;
}

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Book) => void;
  isLoading: boolean;
  onMetadataRefresh: () => void;
  metadata: MetadataResponse['data'] | null;
}

const COMMISSION_OPTIONS = [
  { value: 0, label: '0%' },
  { value: 25, label: '25%' },
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' }
] as const;

// Initial book state
const INITIAL_BOOK_STATE: Book = {
  name: '',
  description: '',
  qty: '',
  sellingPrice: '',
  normalPrice: '',
  category: [],
  language: [],
  format: [],
  genre: [],
  rated: '',
  display_images: [],
  isbn: '',
  publisher: '',
  referralCommission: 0
};

// Validation helper functions
const validateRequired = (value: string | unknown[], fieldName: string): string => {
  if (Array.isArray(value)) {
    return value.length === 0 ? `${fieldName} is required` : '';
  }
  return !value || value.trim() === '' ? `${fieldName} is required` : '';
};

const validateNumeric = (value: string, fieldName: string, min = 0): string => {
  if (!value) return `${fieldName} is required`;
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return `${fieldName} must be a valid number`;
  if (numValue < min) return `${fieldName} must be at least ${min}`;
  return '';
};

const validateISBN = (isbn: string): string => {
  if (!isbn) return 'ISBN is required';
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  if (!/^\d{10}(\d{3})?$/.test(cleanISBN)) {
    return 'ISBN must be 10 or 13 digits';
  }
  return '';
};

export default function AddBookModal({
  isOpen,
  onClose,
  onAddBook,
  isLoading,
  onMetadataRefresh,
  metadata
}: AddBookModalProps) {
  // State management
  const [book, setBook] = useState<Book>(INITIAL_BOOK_STATE);
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isDirty: false,
    errors: {}
  });

  // Search states for dropdowns
  const [searchStates, setSearchStates] = useState({
    category: '',
    genre: '',
    language: '',
    format: ''
  });

  // Dropdown states
  const [dropdownStates, setDropdownStates] = useState({
    category: false,
    genre: false,
    language: false,
    format: false
  });

  // Commission states
  const [commissionState, setCommissionState] = useState({
    isCustom: false,
    customValue: '',
    warning: ''
  });

  // Refs for dropdown management
  const categoryRef = useRef<HTMLDivElement>(null);
  const genreRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const formatRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useMemo(() => ({
    category: categoryRef,
    genre: genreRef,
    language: languageRef,
    format: formatRef
  }), []);

  // Map backend data to dropdown format
  const categories = useMemo(() => metadata?.categories.map(c => ({ value: c.id, label: c.name })) || [], [metadata]);
  const genres = useMemo(() => metadata?.genres.map(g => ({ value: g.id, label: g.name })) || [], [metadata]);
  const languages = useMemo(() => metadata?.languages.map(l => ({ value: l.id, label: l.name })) || [], [metadata]);
  const formats = useMemo(() => metadata?.formats.map(f => ({ value: f.id, label: f.name })) || [], [metadata]);
  const ageRatings = metadata?.ageRatings.map(a => ({ value: a.name, label: a.name, description: '' })) || [];

  // Memoized filtered options
  const filteredOptions = useMemo(() => ({
    categories: categories.filter(cat =>
      cat.label.toLowerCase().includes(searchStates.category.toLowerCase())
    ),
    genres: genres.filter(genre =>
      genre.label.toLowerCase().includes(searchStates.genre.toLowerCase())
    ),
    languages: languages.filter(lang =>
      lang.label.toLowerCase().includes(searchStates.language.toLowerCase())
    ),
    formats: formats.filter(format =>
      format.label.toLowerCase().includes(searchStates.format.toLowerCase())
    )
  }), [searchStates, categories, genres, languages, formats]);

  // Label lookup functions
  const getLabelByValue = useCallback(
    (value: string, type: 'category' | 'genre' | 'language' | 'format') => {
      const maps = {
        category: categories,
        genre: genres,
        language: languages,
        format: formats,
      };
      return maps[type].find(item => item.value === value)?.label || '';
    },
    [categories, genres, languages, formats]
  );

  // Validation function
  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Required field validations
    errors.name = validateRequired(book.name, 'Book name');
    errors.description = validateRequired(book.description, 'Description');
    errors.category = validateRequired(book.category, 'Category');
    errors.language = validateRequired(book.language, 'Language');
    errors.format = validateRequired(book.format, 'Format');
    errors.genre = validateRequired(book.genre, 'Genre');
    errors.rated = validateRequired(book.rated, 'Rating');
    errors.publisher = validateRequired(book.publisher, 'Publisher');

    // Numeric validations
    errors.qty = validateNumeric(book.qty, 'Quantity', 0);
    errors.sellingPrice = validateNumeric(book.sellingPrice, 'Selling price', 0);
    errors.normalPrice = validateNumeric(book.normalPrice, 'Normal price', 0);

    // ISBN validation
    errors.isbn = validateISBN(book.isbn);

    // Price comparison validation
    if (!errors.sellingPrice && !errors.normalPrice) {
      const selling = parseFloat(book.sellingPrice);
      const normal = parseFloat(book.normalPrice);
      if (selling > normal) {
        errors.sellingPrice = 'Selling price cannot be higher than normal price';
      }
    }

    // Remove empty error messages
    return Object.fromEntries(
      Object.entries(errors).filter(([, value]) => value !== '')
    );
  }, [book]);

  // Reset form
  const handleReset = useCallback(() => {
    setBook(INITIAL_BOOK_STATE);
    setFormState({ isSubmitting: false, isDirty: false, errors: {} });
    setSearchStates({ category: '', genre: '', language: '', format: '' });
    setDropdownStates({ category: false, genre: false, language: false, format: false });
    setCommissionState({ isCustom: false, customValue: '', warning: '' });
  }, []);

  // Handle form submission - FIXED VERSION
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submit function called'); // Debug log
    
    const errors = validateForm();
    console.log('Validation errors:', errors); // Debug log
    
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({ ...prev, errors }));
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
      console.log('Submitting book:', book);
      await onAddBook(book);
      handleReset();
      onClose();
    } catch (error) {
      console.error('Error adding book:', error);
      setFormState(prev => ({ 
        ...prev, 
        errors: { submit: 'Failed to add book. Please try again.' }
      }));
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [book, onAddBook, onClose, validateForm, handleReset]);

  // FIXED: Handle button click directly
  const handleProceedClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Proceed button clicked'); // Debug log
    
    // Find the form and trigger submit
    const form = document.querySelector('#add-book-form') as HTMLFormElement;
    if (form) {
      form.requestSubmit();
    } else {
      // Fallback: call handleSubmit directly
      const syntheticEvent = {
        preventDefault: () => {},
        // Add any other properties if needed by handleSubmit
      } as React.FormEvent<HTMLFormElement>;
      await handleSubmit(syntheticEvent);
    }
  }, [handleSubmit]);

  // Handle modal close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (formState.isDirty) {
      const shouldClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!shouldClose) return;
    }
    handleReset();
    onClose();
  }, [formState.isDirty, onClose, handleReset]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(dropdownRefs).forEach(([key, ref]) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setDropdownStates(prev => ({ ...prev, [key]: false }));
          setSearchStates(prev => ({ ...prev, [key]: '' }));
        }
      });
    };

    const hasOpenDropdown = Object.values(dropdownStates).some(Boolean);
    if (hasOpenDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownStates, dropdownRefs]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const hasOpenDropdown = Object.values(dropdownStates).some(Boolean);
        if (hasOpenDropdown) {
          setDropdownStates({ category: false, genre: false, language: false, format: false });
          setSearchStates({ category: '', genre: '', language: '', format: '' });
        } else {
          handleClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dropdownStates, handleClose]);

  // Mark form as dirty when book changes
  useEffect(() => {
    const isDirty = JSON.stringify(book) !== JSON.stringify(INITIAL_BOOK_STATE);
    setFormState(prev => ({ ...prev, isDirty }));
  }, [book]);

  // Handle selection functions
  const handleSelection = useCallback((type: 'category' | 'genre' | 'language' | 'format', value: string) => {
    setBook(prev => {
      const arr = prev[type as keyof Pick<Book, 'category' | 'genre' | 'language' | 'format'>] as string[];
      const exists = arr.includes(value);
      return {
        ...prev,
        [type]: exists ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
    setDropdownStates(prev => ({ ...prev, [type]: false }));
    setSearchStates(prev => ({ ...prev, [type]: '' }));
  }, []);

  // Multi-select handler for genre (does not close dropdown or reset search)
  const handleGenreSelect = useCallback((value: string) => {
    setBook(prev => {
      const arr = prev.genre;
      const exists = arr.includes(value);
      return {
        ...prev,
        genre: exists ? arr.filter(v => v !== value) : [...arr, value]
      };
    });
  }, []);

  // Handle removal functions
  const handleRemoval = useCallback((type: 'category' | 'genre' | 'language' | 'format', value: string) => {
    setBook(prev => ({
      ...prev,
      [type]: (prev[type as keyof Pick<Book, 'category' | 'genre' | 'language' | 'format'>] as string[])
        .filter(item => item !== value)
    }));
  }, []);

  if (!isOpen) return null;

  // Show loading or error state for metadata
  if (!metadata) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
          <span className="text-lg font-medium text-gray-700">Loading book metadata...</span>
          <button onClick={onMetadataRefresh} className="mt-4 px-6 py-2 bg-gray-200 rounded-lg text-gray-700 font-medium flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 sticky top-0 z-10 sm:p-4 sm:pt-6 sm:pb-4 sm:rounded-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 id="modal-title" className="text-2xl font-semibold text-gray-900 sm:text-lg">
                  Add New Book
                </h2>
                <p className="text-sm text-gray-600 mt-1 sm:text-xs">
                  Complete all required fields to add a book to your inventory
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onMetadataRefresh}
                className="text-gray-400 hover:text-indigo-600 transition-colors p-2 hover:bg-gray-100 rounded-lg sm:p-3"
                aria-label="Refresh metadata"
                title="Refresh metadata"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              {formState.isDirty && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg sm:p-3 sm:-mr-2"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>
          </div>
          {/* Reset Form Button at the top */}
          {formState.isDirty && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg px-4 py-2 bg-white sm:px-3 sm:py-1.5"
              >
                Reset Form
              </button>
            </div>
          )}
        </div>

        {/* Error Summary */}
        {Object.keys(formState.errors).length > 0 && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-medium text-red-800">
                Please correct the following errors:
              </h3>
            </div>
            <ul className="mt-2 text-sm text-red-700 space-y-1">
              {Object.entries(formState.errors).map(([field, error]) => (
                <li key={field} className="flex items-center space-x-1">
                  <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(95vh-12rem)] sm:max-h-none sm:pb-32">
          <form id="add-book-form" onSubmit={handleSubmit} className="p-6 space-y-8 sm:p-4 sm:space-y-6">
            <BookBasicInfoSection 
              book={book} 
              setBook={setBook}
            />
            
            <PricingInventorySection
              book={book}
              setBook={setBook}
              commissionState={commissionState}
              setCommissionState={setCommissionState}
              commissionOptions={[...COMMISSION_OPTIONS]}
            />
            
            <ClassificationSection
              book={book}
              setBook={setBook}
              filteredOptions={filteredOptions}
              dropdownRefs={dropdownRefs}
              dropdownStates={dropdownStates}
              setDropdownStates={setDropdownStates}
              searchStates={searchStates}
              setSearchStates={setSearchStates}
              onSelection={handleSelection}
              onRemoval={handleRemoval}
              getLabelByValue={getLabelByValue}
            />
            
            <AdditionalDetailsSection
              book={book}
              setBook={setBook}
              filteredGenres={filteredOptions.genres}
              genreDropdownRef={dropdownRefs.genre}
              isGenreDropdownOpen={dropdownStates.genre}
              setIsGenreDropdownOpen={(isOpen) => setDropdownStates(prev => ({ ...prev, genre: isOpen }))}
              genreSearch={searchStates.genre}
              setGenreSearch={(search) => setSearchStates(prev => ({ ...prev, genre: search }))}
              onGenreSelect={handleGenreSelect}
              onGenreRemove={(value: string) => handleRemoval('genre', value)}
              getGenreLabel={(value) => getLabelByValue(value, 'genre')}
              ageRatings={ageRatings}
            />
            
            <MediaPublisherSection 
              book={book} 
              setBook={setBook}
            />

            {/* Hidden submit button for form submission */}
            <button type="submit" style={{ display: 'none' }} aria-hidden="true">Submit</button>

            {/* Spacer for sticky action bar on mobile */}
            <div className="h-4 sm:h-24" />
          </form>
        </div>

        {/* Enhanced Action Buttons - sticky on mobile */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-white sticky bottom-0 z-20 px-6 sm:px-4 sm:py-4 sm:pt-2 sm:pb-4 sm:rounded-none sm:shadow-[0_-2px_8px_0_rgba(0,0,0,0.04)]">
          <div className="flex items-center space-x-3">
            {formState.isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors sm:text-base"
              >
                Reset Form
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium sm:px-4 sm:py-2 sm:text-base"
              disabled={formState.isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleProceedClick}
              disabled={formState.isSubmitting || isLoading}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 sm:px-4 sm:py-2 sm:text-base"
            >
              {(formState.isSubmitting || isLoading) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding Book...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Proceed</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}