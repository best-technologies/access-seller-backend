import { useState } from 'react';
import { X, Plus, Loader2, Book, Tag, Globe, BookOpen, Hash, Edit2, Trash2 } from 'lucide-react';
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
    publisher: ''
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIndex !== null) {
      // Update existing book
      const updatedBooks = [...books];
      updatedBooks[editingIndex] = book;
      onAddBook(updatedBooks[editingIndex]);
      setEditingIndex(null);
    } else {
      // Add new book
      onAddBook(book);
    }
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
      publisher: ''
    });
  };

  const handleEdit = (index: number) => {
    setBook(books[index]);
    setEditingIndex(index);
    // Scroll to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemove = (index: number) => {
    const updatedBooks = [...books];
    updatedBooks.splice(index, 1);
    onAddBook(updatedBooks[0]); // This will trigger a re-render with the updated books array
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
              <div className="grid grid-cols-2 gap-6">
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
                    <label htmlFor="description" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Description</label>
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
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="relative">
                  <input
                    type="number"
                    value={book.qty}
                    onChange={(e) => setBook({ ...book, qty: parseInt(e.target.value) })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Quantity"
                  />
                    <label htmlFor="quantity" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Quantity</label>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                    <input
                      type="number"
                      value={book.sellingPrice}
                      onChange={(e) => setBook({ ...book, sellingPrice: parseFloat(e.target.value) })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 pl-8 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                      required
                      aria-label="Selling Price"
                    />
                    <label htmlFor="selling-price" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Selling Price</label>
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                    <input
                      type="number"
                      value={book.normalPrice}
                      onChange={(e) => setBook({ ...book, normalPrice: parseFloat(e.target.value) })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 pl-8 pr-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                      required
                      aria-label="Normal Price"
                    />
                    <label htmlFor="normal-price" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Normal Price</label>
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
                  <select
                    value={book.category}
                    onChange={(e) => setBook({ ...book, category: e.target.value })}
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Category"
                  >
                    <option value="">Select Category</option>
                    <option value="fiction">Fiction</option>
                    <option value="non-fiction">Non-Fiction</option>
                    <option value="science-fiction">Science Fiction</option>
                    <option value="romance">Romance</option>
                    <option value="mystery">Mystery & Thriller</option>
                    <option value="biography">Biography</option>
                    <option value="history">History</option>
                    <option value="self-help">Self-Help</option>
                  </select>
                    <label htmlFor="category" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Category</label>
                  </div>
                </div>

                <div>
                  <div className="relative">
                  <select
                    value={book.language}
                    onChange={(e) => setBook({ ...book, language: e.target.value })}
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Language"
                  >
                    <option value="">Select Language</option>
                    <option value="english">English</option>
                    <option value="spanish">Spanish</option>
                    <option value="french">French</option>
                    <option value="german">German</option>
                    <option value="chinese">Chinese</option>
                    <option value="japanese">Japanese</option>
                  </select>
                    <label htmlFor="language" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Language</label>
                  </div>
                </div>

                <div>
                  <div className="relative">
                  <select
                    value={book.format}
                    onChange={(e) => setBook({ ...book, format: e.target.value })}
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Format"
                  >
                    <option value="">Select Format</option>
                    <option value="hardcover">Hardcover</option>
                    <option value="paperback">Paperback</option>
                    <option value="e-book">E-Book</option>
                    <option value="audiobook">Audiobook</option>
                  </select>
                    <label htmlFor="format" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Format</label>
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
                  <div className="relative">
                  <input
                    type="text"
                    value={book.genre}
                    onChange={(e) => setBook({ ...book, genre: e.target.value })}
                      placeholder=" "
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Genre"
                  />
                    <label htmlFor="genre" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Genre</label>
                  </div>
                </div>

                <div>
                  <div className="relative">
                  <select
                    value={book.rated}
                    onChange={(e) => setBook({ ...book, rated: e.target.value })}
                      className="peer w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors bg-gray-50 focus:bg-white"
                    required
                      aria-label="Age Rating"
                  >
                    <option value="">Select Age Rating</option>
                    <option value="all-ages">All Ages</option>
                    <option value="children">Children (0-12)</option>
                    <option value="teen">Teen (13-17)</option>
                    <option value="adult">Adult (18+)</option>
                  </select>
                    <label htmlFor="age-rating" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Age Rating</label>
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
                    <label htmlFor="cover-image-upload" className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
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
                    <label htmlFor="publisher" className="absolute left-4 top-2.5 text-gray-500 text-sm transition-all peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-gray-400 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-600 bg-white px-1 pointer-events-none">Publisher</label>
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