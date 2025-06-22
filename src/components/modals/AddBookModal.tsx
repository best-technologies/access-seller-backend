"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Loader2, 
  Book, 
  BookOpen, 
  AlertCircle
} from 'lucide-react';
import BookBasicInfoSection from './addBook/BookBasicInfoSection';
import PricingInventorySection from './addBook/PricingInventorySection';
import ClassificationSection from './addBook/ClassificationSection';
import AdditionalDetailsSection from './addBook/AdditionalDetailsSection';
import MediaPublisherSection from './addBook/MediaPublisherSection';

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
}

// Constants moved outside component for better performance
const BOOK_CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'arts', label: 'Arts' },
  { value: 'biography', label: 'Biography' },
  { value: 'business', label: 'Business' },
  { value: 'children', label: 'Children' },
  { value: 'comics', label: 'Comics' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'dictionary', label: 'Dictionary' },
  { value: 'drama', label: 'Drama' },
  { value: 'economics', label: 'Economics' },
  { value: 'encyclopedia', label: 'Encyclopedia' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'graphic_novels', label: 'Graphic Novels' },
  { value: 'health', label: 'Health' },
  { value: 'history', label: 'History' },
  { value: 'horror', label: 'Horror' },
  { value: 'humor', label: 'Humor' },
  { value: 'literature', label: 'Literature' },
  { value: 'magazine', label: 'Magazine' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'newspaper', label: 'Newspaper' },
  { value: 'non_fiction', label: 'Non-Fiction' },
  { value: 'other', label: 'Other' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'poetry', label: 'Poetry' },
  { value: 'politics', label: 'Politics' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'reference', label: 'Reference' },
  { value: 'religion', label: 'Religion' },
  { value: 'romance', label: 'Romance' },
  { value: 'science', label: 'Science' },
  { value: 'science_fiction', label: 'Science Fiction' },
  { value: 'self_help', label: 'Self-Help' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
  { value: 'textbook', label: 'Textbook' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'travel', label: 'Travel' },
  { value: 'western', label: 'Western' },
  { value: 'young_adult', label: 'Young Adult' }
] as const;

const BOOK_GENRES = [
  { value: 'biography', label: 'Biography' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'fiction', label: 'Fiction' },
  { value: 'horror', label: 'Horror' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'non_fiction', label: 'Non-Fiction' },
  { value: 'other', label: 'Other' },
  { value: 'romance', label: 'Romance' },
  { value: 'science_fiction', label: 'Science Fiction' },
  { value: 'self_help', label: 'Self-Help' }
] as const;

const BOOK_LANGUAGES = [
  { value: 'chinese', label: 'Chinese' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'spanish', label: 'Spanish' }
] as const;

const BOOK_FORMATS = [
  { value: 'audiobook', label: 'Audiobook' },
  { value: 'e-book', label: 'E-Book' },
  { value: 'hardcover', label: 'Hardcover' },
  { value: 'paperback', label: 'Paperback' }
] as const;

const COMMISSION_OPTIONS = [
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
  isLoading
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
  const dropdownRefs = {
    category: categoryRef,
    genre: genreRef,
    language: languageRef,
    format: formatRef
  };

  // Memoized filtered options
  const filteredOptions = useMemo(() => ({
    categories: BOOK_CATEGORIES.filter(cat =>
      cat.label.toLowerCase().includes(searchStates.category.toLowerCase())
    ),
    genres: BOOK_GENRES.filter(genre =>
      genre.label.toLowerCase().includes(searchStates.genre.toLowerCase())
    ),
    languages: BOOK_LANGUAGES.filter(lang =>
      lang.label.toLowerCase().includes(searchStates.language.toLowerCase())
    ),
    formats: BOOK_FORMATS.filter(format =>
      format.label.toLowerCase().includes(searchStates.format.toLowerCase())
    )
  }), [searchStates]);

  // Label lookup functions
  const getLabelByValue = useCallback((value: string, type: 'category' | 'genre' | 'language' | 'format') => {
    const maps = {
      category: BOOK_CATEGORIES,
      genre: BOOK_GENRES,
      language: BOOK_LANGUAGES,
      format: BOOK_FORMATS
    };
    return maps[type].find(item => item.value === value)?.label || '';
  }, []);

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

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFormState(prev => ({ ...prev, errors }));
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-error="true"]');
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, errors: {} }));

    try {
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

  return (
    <div 
      className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center transition-all duration-300"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 id="modal-title" className="text-2xl font-semibold text-gray-900">
                  Add New Book
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Complete all required fields to add a book to your inventory
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {formState.isDirty && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full border border-orange-200">
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
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
        <div className="overflow-y-auto max-h-[calc(95vh-12rem)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
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
            />
            
            <MediaPublisherSection 
              book={book} 
              setBook={setBook}
            />

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-4">
                {formState.isDirty && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset Form
                  </button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                  disabled={formState.isSubmitting}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={formState.isSubmitting || isLoading}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {(formState.isSubmitting || isLoading) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding Book...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Book</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}