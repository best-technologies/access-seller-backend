"use client"

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Loader2, Book, Tag, Globe, BookOpen, Hash, Edit2, Trash2, Search, ChevronDown } from 'lucide-react';
import Image from 'next/image';

interface Book {
  name: string;
  description: string;
  qty: number;
  sellingPrice: number;
  normalPrice: number;
  category: string;
  language: string;
  format: string;
  genre: string;
  rated: string;
  coverImage: string;
  isbn: string;
  publisher: string;
  referralCommission: number;
}

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: Book) => void;
  onProceed: () => void;
  books: Book[];
  isLoading: boolean;
}

export default function AddBookModal({
  isOpen,
  onClose,
  onAddBook,
  onProceed,
  books,
  isLoading
}: AddBookModalProps) {
  const [book, setBook] = useState<Book>({
    name: '',
    description: '',
    qty: 0,
    sellingPrice: 0,
    normalPrice: 0,
    category: '',
    language: '',
    format: '',
    genre: '',
    rated: '',
    coverImage: '',
    isbn: '',
    publisher: '',
    referralCommission: 0
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [genreSearch, setGenreSearch] = useState('');
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [languageSearch, setLanguageSearch] = useState('');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [formatSearch, setFormatSearch] = useState('');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [customCommission, setCustomCommission] = useState('');
  const [isCustomCommission, setIsCustomCommission] = useState(false);
  const [commissionWarning, setCommissionWarning] = useState('');
  const [quantityWarning, setQuantityWarning] = useState('');
  const [sellingPriceWarning, setSellingPriceWarning] = useState('');
  const [normalPriceWarning, setNormalPriceWarning] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const genreDropdownRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
        setCategorySearch('');
      }
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(event.target as Node)) {
        setIsGenreDropdownOpen(false);
        setGenreSearch('');
      }
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
        setLanguageSearch('');
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(event.target as Node)) {
        setIsFormatDropdownOpen(false);
        setFormatSearch('');
      }
    };

    if (isCategoryDropdownOpen || isGenreDropdownOpen || isLanguageDropdownOpen || isFormatDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen, isGenreDropdownOpen, isLanguageDropdownOpen, isFormatDropdownOpen]);

  // Book categories from the enum
  const bookCategories = [
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
  ];

  // Book genres from the enum
  const bookGenres = [
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
  ];

  // Book languages from the enum
  const bookLanguages = [
    { value: 'chinese', label: 'Chinese' },
    { value: 'english', label: 'English' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'japanese', label: 'Japanese' },
    { value: 'spanish', label: 'Spanish' }
  ];

  // Book formats from the enum
  const bookFormats = [
    { value: 'audiobook', label: 'Audiobook' },
    { value: 'e-book', label: 'E-Book' },
    { value: 'hardcover', label: 'Hardcover' },
    { value: 'paperback', label: 'Paperback' }
  ];

  // Referral commission options
  const commissionOptions = [
    { value: 25, label: '25%' },
    { value: 50, label: '50%' },
    { value: 75, label: '75%' },
    { value: 100, label: '100%' }
  ];

  // Filter categories based on search
  const filteredCategories = bookCategories.filter(category =>
    category.label.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Filter genres based on search
  const filteredGenres = bookGenres.filter(genre =>
    genre.label.toLowerCase().includes(genreSearch.toLowerCase())
  );

  // Filter languages based on search
  const filteredLanguages = bookLanguages.filter(language =>
    language.label.toLowerCase().includes(languageSearch.toLowerCase())
  );

  // Filter formats based on search
  const filteredFormats = bookFormats.filter(format =>
    format.label.toLowerCase().includes(formatSearch.toLowerCase())
  );

  const handleCategorySelect = (categoryValue: string) => {
    setBook({ ...book, category: categoryValue });
    setCategorySearch('');
    setIsCategoryDropdownOpen(false);
  };

  const handleGenreSelect = (genreValue: string) => {
    setBook({ ...book, genre: genreValue });
    setGenreSearch('');
    setIsGenreDropdownOpen(false);
  };

  const handleLanguageSelect = (languageValue: string) => {
    setBook({ ...book, language: languageValue });
    setLanguageSearch('');
    setIsLanguageDropdownOpen(false);
  };

  const handleFormatSelect = (formatValue: string) => {
    setBook({ ...book, format: formatValue });
    setFormatSearch('');
    setIsFormatDropdownOpen(false);
  };

  const getCategoryLabel = (value: string) => {
    const category = bookCategories.find(cat => cat.value === value);
    return category ? category.label : 'Select Category';
  };

  const getGenreLabel = (value: string) => {
    const genre = bookGenres.find(gen => gen.value === value);
    return genre ? genre.label : 'Select Genre';
  };

  const getLanguageLabel = (value: string) => {
    const language = bookLanguages.find(lang => lang.value === value);
    return language ? language.label : 'Select Language';
  };

  const getFormatLabel = (value: string) => {
    const format = bookFormats.find(fmt => fmt.value === value);
    return format ? format.label : 'Select Format';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingIndex !== null) {
      // Update existing book
      const updatedBooks = [...books];
      updatedBooks[editingIndex] = book;
      onAddBook(updatedBooks[0]); // This will trigger a re-render
      setEditingIndex(null);
    } else {
      // Add new book
      onAddBook(book);
    }
    
    // Reset form
    setBook({
      name: '',
      description: '',
      qty: 0,
      sellingPrice: 0,
      normalPrice: 0,
      category: '',
      language: '',
      format: '',
      genre: '',
      rated: '',
      coverImage: '',
      isbn: '',
      publisher: '',
      referralCommission: 0
    });
    setIsCustomCommission(false);
    setCustomCommission('');
    setCommissionWarning('');
    setQuantityWarning('');
    setSellingPriceWarning('');
    setNormalPriceWarning('');
  };

  const handleEdit = (index: number) => {
    setBook(books[index]);
    setEditingIndex(index);
    setIsCustomCommission(false);
    setCustomCommission('');
    setCommissionWarning('');
    setQuantityWarning('');
    setSellingPriceWarning('');
    setNormalPriceWarning('');
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = (index: number) => {
    const newBooks = books.filter((_, i) => i !== index);
    onAddBook(newBooks[0]); // This will be handled by the parent component
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {editingIndex !== null ? 'Edit Book' : 'Add New Book'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {editingIndex !== null 
                  ? 'Update the book details below'
                  : 'Fill in the details to add a new book to your collection'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-2 text-gray-900">
                <Book className="h-5 w-5" />
                <h3 className="font-medium">Basic Information</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <div className="relative">
                  <input
                    type="text"
                      id="book-name"
                    value={book.name}
                    onChange={(e) => setBook({ ...book, name: e.target.value })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Book Name"
                  />
                    <label htmlFor="book-name" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Book Name</label>
                  </div>
                </div>

                <div>
                  <div className="relative">
                  <textarea
                    value={book.description}
                    onChange={(e) => setBook({ ...book, description: e.target.value })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    rows={3}
                    required
                      aria-label="Description"
                  />
                    <label className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Description</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing & Inventory Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-2 text-gray-900">
                <Tag className="h-5 w-5" />
                <h3 className="font-medium">Pricing & Inventory</h3>
              </div>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="relative">
                  <input
                    type="number"
                    value={book.qty}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      
                      // Clear warning when input is valid
                      setQuantityWarning('');
                      
                      // Prevent negative values
                      if (value < 0) {
                        setQuantityWarning('Quantity cannot be less than 0');
                        return;
                      }
                      
                      setBook({ ...book, qty: value });
                    }}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Quantity"
                  />
                    <label htmlFor="quantity" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Quantity</label>
                    {quantityWarning && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {quantityWarning}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                    <input
                      type="number"
                      value={book.sellingPrice}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        
                        // Clear warning when input is valid
                        setSellingPriceWarning('');
                        
                        // Prevent negative values
                        if (value < 0) {
                          setSellingPriceWarning('Selling price cannot be less than 0');
                          return;
                        }
                        
                        setBook({ ...book, sellingPrice: value });
                      }}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 pl-8 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                      required
                      aria-label="Selling Price"
                    />
                    <label htmlFor="selling-price" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Selling Price</label>
                    {sellingPriceWarning && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {sellingPriceWarning}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                    <input
                      type="number"
                      value={book.normalPrice}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        
                        // Clear warning when input is valid
                        setNormalPriceWarning('');
                        
                        // Prevent negative values
                        if (value < 0) {
                          setNormalPriceWarning('Normal price cannot be less than 0');
                          return;
                        }
                        
                        setBook({ ...book, normalPrice: value });
                      }}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 pl-8 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                      required
                      aria-label="Normal Price"
                    />
                    <label htmlFor="normal-price" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Normal Price</label>
                    {normalPriceWarning && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                        {normalPriceWarning}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    {isCustomCommission ? (
                      <div className="relative">
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                        <input
                          type="number"
                          value={customCommission}
                          onChange={(e) => {
                            const value = e.target.value;
                            const numValue = parseFloat(value);
                            
                            // Clear warning when input is valid
                            setCommissionWarning('');
                            
                            // Prevent negative values
                            if (numValue < 0) {
                              setCommissionWarning('Commission cannot be less than 0%');
                              return;
                            }
                            
                            // Prevent values greater than 100
                            if (numValue > 100) {
                              setCommissionWarning('Commission cannot exceed 100%');
                              return;
                            }
                            
                            setCustomCommission(value);
                            setBook({ ...book, referralCommission: numValue || 0 });
                          }}
                          placeholder=" "
                          className="peer w-full rounded-lg border border-gray-200 px-4 pr-8 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                          min="0"
                          max="100"
                          step="0.1"
                          required
                          aria-label="Custom Commission"
                        />
                        <label className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Custom Commission</label>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomCommission(false);
                            setCustomCommission('');
                            setCommissionWarning('');
                            setBook({ ...book, referralCommission: 0 });
                          }}
                          className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        {commissionWarning && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            {commissionWarning}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <select
                          value={book.referralCommission}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value === -1) {
                              setIsCustomCommission(true);
                              setCustomCommission('');
                            } else {
                              setBook({ ...book, referralCommission: value });
                            }
                          }}
                          className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white appearance-none"
                          required
                          aria-label="Referral Commission"
                        >
                          <option value="">Select Commission</option>
                          {commissionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                          <option value="-1">Custom %</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        <label className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">
                          Referral Commission
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Classification Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-2 text-gray-900">
                <BookOpen className="h-5 w-5" />
                <h3 className="font-medium">Classification</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="relative">
                    <div className="relative" ref={categoryDropdownRef}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white text-left flex items-center justify-between"
                      >
                        <span className={book.category ? 'text-gray-900' : 'text-gray-500'}>
                          {getCategoryLabel(book.category)}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {isCategoryDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* Categories List */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                              <button
                                key={category.value}
                                type="button"
                                onClick={() => handleCategorySelect(category.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between"
                              >
                                <span>{category.label}</span>
                                {book.category === category.value && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No categories found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative" ref={languageDropdownRef}>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <button
                        type="button"
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white text-left flex items-center justify-between"
                      >
                        <span className={book.language ? 'text-gray-900' : 'text-gray-500'}>
                          {getLanguageLabel(book.language)}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {isLanguageDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search languages..."
                              value={languageSearch}
                              onChange={(e) => setLanguageSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* Languages List */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((language) => (
                              <button
                                key={language.value}
                                type="button"
                                onClick={() => handleLanguageSelect(language.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between"
                              >
                                <span>{language.label}</span>
                                {book.language === language.value && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No languages found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative" ref={formatDropdownRef}>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                      <button
                        type="button"
                        onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white text-left flex items-center justify-between"
                      >
                        <span className={book.format ? 'text-gray-900' : 'text-gray-500'}>
                          {getFormatLabel(book.format)}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {isFormatDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search formats..."
                              value={formatSearch}
                              onChange={(e) => setFormatSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* Formats List */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredFormats.length > 0 ? (
                            filteredFormats.map((format) => (
                              <button
                                key={format.value}
                                type="button"
                                onClick={() => handleFormatSelect(format.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between"
                              >
                                <span>{format.label}</span>
                                {book.format === format.value && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No formats found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-2 text-gray-900">
                <Globe className="h-5 w-5" />
                <h3 className="font-medium">Additional Details</h3>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="relative" ref={genreDropdownRef}>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                      <button
                        type="button"
                        onClick={() => setIsGenreDropdownOpen(!isGenreDropdownOpen)}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white text-left flex items-center justify-between"
                      >
                        <span className={book.genre ? 'text-gray-900' : 'text-gray-500'}>
                          {getGenreLabel(book.genre)}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isGenreDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    
                    {isGenreDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search genres..."
                              value={genreSearch}
                              onChange={(e) => setGenreSearch(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              autoFocus
                            />
                          </div>
                        </div>
                        
                        {/* Genres List */}
                        <div className="max-h-48 overflow-y-auto">
                          {filteredGenres.length > 0 ? (
                            filteredGenres.map((genre) => (
                              <button
                                key={genre.value}
                                type="button"
                                onClick={() => handleGenreSelect(genre.value)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center justify-between"
                              >
                                <span>{genre.label}</span>
                                {book.genre === genre.value && (
                                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                              No genres found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Rating</label>
                  <select
                    value={book.rated}
                    onChange={(e) => setBook({ ...book, rated: e.target.value })}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white appearance-none"
                    required
                      aria-label="Age Rating"
                  >
                    <option value="">Select Age Rating</option>
                    <option value="all-ages">All Ages</option>
                    <option value="children">Children (0-12)</option>
                    <option value="teen">Teen (13-17)</option>
                    <option value="adult">Adult (18+)</option>
                  </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="relative">
                  <input
                    type="text"
                    value={book.isbn}
                    onChange={(e) => setBook({ ...book, isbn: e.target.value })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="ISBN"
                  />
                    <label htmlFor="isbn" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">ISBN</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Media & Publisher Section */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg">
              <div className="flex items-center gap-2 text-gray-900">
                <div className="relative w-5 h-5">
                  <Image 
                    src="/images/icons/media.svg" 
                    alt="Media icon"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="font-medium">Media & Publisher</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="relative">
                    <label htmlFor="cover-image-upload" className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                  <input
                      id="cover-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files && e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setBook({ ...book, coverImage: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                      aria-label="Cover Image Upload"
                    required
                  />
                    {book.coverImage && (
                      <div className="flex items-center gap-4 mt-2">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                          <Image src={book.coverImage} alt="Cover Preview" width={64} height={64} className="object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative">
                  <input
                    type="text"
                    value={book.publisher}
                    onChange={(e) => setBook({ ...book, publisher: e.target.value })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Publisher"
                  />
                    <label className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Publisher</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-95 transition-transform"
              >
                {editingIndex !== null ? (
                  <>
                    <Edit2 className="h-5 w-5" />
                    Update Book
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Add Another Book
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onProceed}
                disabled={isLoading || books.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 active:scale-95 transition-transform"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Proceed'
                )}
              </button>
            </div>
          </form>

          {/* Added Books List */}
          {books.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 text-gray-900 mb-4">
                <Hash className="h-5 w-5" />
                <h3 className="font-medium">Added Books ({books.length})</h3>
              </div>
              <div className="space-y-3">
                {books.map((addedBook, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-gray-100 flex items-center gap-4 shadow-sm"
                  >
                    {addedBook.coverImage && (
                      <Image src={addedBook.coverImage} alt={addedBook.name} width={48} height={48} className="rounded-md object-cover border border-gray-200" />
                    )}
                      <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{addedBook.name}</h4>
                      <p className="text-xs text-gray-500">{addedBook.category} • {addedBook.format}</p>
                      </div>
                        <div className="text-right">
                      <span className="text-sm font-bold text-indigo-700">₦{addedBook.sellingPrice}</span>
                      <p className="text-xs text-gray-400">Qty: {addedBook.qty}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(index)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit book"
                        aria-label="Edit book"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(index)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove book"
                        aria-label="Remove book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 