import { Book } from '../AddBookModal';

interface Props {
  book: Book;
  setBook: (book: Book) => void;
}

export default function BookBasicInfoSection({ book, setBook }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100 transition-shadow hover:shadow-lg">
      <div className="flex items-center gap-2 text-gray-900">
        {/* Book icon and section title can be added here if needed */}
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
  );
} 