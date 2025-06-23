import { X, ChevronDown, DollarSign } from 'lucide-react';
import { Book } from '../AddBookModal';
import { useState, useRef, useEffect } from 'react';

interface CommissionState {
  isCustom: boolean;
  customValue: string;
  warning: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface Props {
  book: Book;
  setBook: (book: Book) => void;
  commissionState: CommissionState;
  setCommissionState: (val: CommissionState) => void;
  commissionOptions: ReadonlyArray<{ value: number; label: string }>;
  errors?: ValidationErrors;
}

export default function PricingInventorySection({
  book,
  setBook,
  commissionState,
  setCommissionState,
  commissionOptions,
  errors = {}
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid positive numbers
    if (value === '' || (!isNaN(parseInt(value, 10)) && parseInt(value, 10) >= 0)) {
      setBook({ ...book, qty: value });
    }
  };

  const handleSellingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid positive numbers
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      setBook({ ...book, sellingPrice: value });
    }
  };

  const handleNormalPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid positive numbers
    if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
      setBook({ ...book, normalPrice: value });
    }
  };

  const handleCustomCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = parseFloat(value);
    
    // Allow empty string or valid percentage (0-100)
    if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
      setCommissionState({
        isCustom: true,
        customValue: value,
        warning: '',
      });
      setBook({ ...book, referralCommission: numValue || 0 });
    }
  };

  const resetCustomCommission = () => {
    setCommissionState({
      isCustom: false,
      customValue: '',
      warning: '',
    });
    setBook({ ...book, referralCommission: 0 });
  };

  const handleCommissionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = parseInt(e.target.value);
    if (value === -1) {
      setCommissionState({
        isCustom: true,
        customValue: '',
        warning: '',
      });
    } else {
      setBook({ ...book, referralCommission: value });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <DollarSign className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pricing & Inventory</h3>
          <p className="text-sm text-gray-500">Set pricing details and stock quantity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quantity Field */}
        <div className="space-y-1">
          <div className="relative">
            <input
              type="number"
              id="quantity"
              value={book.qty}
              onChange={handleQuantityChange}
              placeholder=" "
              min="0"
              step="1"
              className={`peer w-full rounded-lg border px-4 py-3 focus:ring-2 focus:ring-offset-0 transition-all bg-white placeholder-transparent ${
                errors.qty 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-gray-400'
              }`}
              required
              aria-label="Quantity"
              data-error={!!errors.qty}
            />
            <label 
              htmlFor="quantity" 
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                errors.qty ? 'text-red-600' : 'text-gray-500'
              } peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:bg-white peer-focus:px-1 peer-focus:-translate-y-1/2 ${
                book.qty ? 'top-0 text-xs bg-white px-1 -translate-y-1/2' : ''
              } ${
                errors.qty ? 'peer-focus:text-red-600' : 'peer-focus:text-indigo-600'
              }`}
            >
              Quantity *
            </label>
          </div>
          {errors.qty && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.qty}
            </p>
          )}
        </div>

        {/* Selling Price Field */}
        <div className="space-y-1">
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500 z-10">₦</span>
            <input
              type="number"
              id="selling-price"
              value={book.sellingPrice}
              onChange={handleSellingPriceChange}
              placeholder=" "
              min="0"
              step="0.01"
              className={`peer w-full rounded-lg border pl-8 pr-4 py-3 focus:ring-2 focus:ring-offset-0 transition-all bg-white placeholder-transparent ${
                errors.sellingPrice 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-gray-400'
              }`}
              required
              aria-label="Selling Price"
              data-error={!!errors.sellingPrice}
            />
            <label 
              htmlFor="selling-price" 
              className={`absolute left-8 transition-all duration-200 pointer-events-none ${
                errors.sellingPrice ? 'text-red-600' : 'text-gray-500'
              } peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:bg-white peer-focus:px-1 peer-focus:-translate-y-1/2 peer-focus:left-8 ${
                book.sellingPrice ? 'top-0 text-xs bg-white px-1 -translate-y-1/2 left-8' : ''
              } ${
                errors.sellingPrice ? 'peer-focus:text-red-600' : 'peer-focus:text-indigo-600'
              }`}
            >
              Selling Price *
            </label>
          </div>
          {errors.sellingPrice && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.sellingPrice}
            </p>
          )}
        </div>

        {/* Normal Price Field */}
        <div className="space-y-1">
          <div className="relative">
            <span className="absolute left-4 top-3 text-gray-500 z-10">₦</span>
            <input
              type="number"
              id="normal-price"
              value={book.normalPrice}
              onChange={handleNormalPriceChange}
              placeholder=" "
              min="0"
              step="0.01"
              className={`peer w-full rounded-lg border pl-8 pr-4 py-3 focus:ring-2 focus:ring-offset-0 transition-all bg-white placeholder-transparent ${
                errors.normalPrice 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-200 hover:border-gray-400'
              }`}
              required
              aria-label="Normal Price"
              data-error={!!errors.normalPrice}
            />
            <label 
              htmlFor="normal-price" 
              className={`absolute left-8 transition-all duration-200 pointer-events-none ${
                errors.normalPrice ? 'text-red-600' : 'text-gray-500'
              } peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-focus:top-0 peer-focus:text-xs peer-focus:bg-white peer-focus:px-1 peer-focus:-translate-y-1/2 peer-focus:left-8 ${
                book.normalPrice ? 'top-0 text-xs bg-white px-1 -translate-y-1/2 left-8' : ''
              } ${
                errors.normalPrice ? 'peer-focus:text-red-600' : 'peer-focus:text-indigo-600'
              }`}
            >
              Normal Price *
            </label>
          </div>
          {errors.normalPrice && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.normalPrice}
            </p>
          )}
        </div>

        {/* Commission Field */}
        <div className="space-y-1 flex items-center gap-2">
          <div className="relative flex items-center gap-2 w-full">
            {/* Custom dropdown for commission */}
            <div className="w-full">
              <button
                type="button"
                className={`w-full rounded-lg border px-4 py-3 bg-white text-left flex justify-between items-center focus:ring-2 focus:ring-indigo-200 ${errors.referralCommission ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-indigo-500 hover:border-gray-400'}`}
                onClick={() => setDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
              >
                {commissionOptions.some(opt => opt.value === book.referralCommission)
                  ? commissionOptions.find(opt => opt.value === book.referralCommission)?.label
                  : (book.referralCommission ? `${book.referralCommission}%` : 'Select Commission')}
                <ChevronDown className="h-4 w-4 text-gray-400 ml-2" />
              </button>
              {dropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto" role="listbox">
                  {commissionOptions.map(option => (
                    <li
                      key={option.value}
                      className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 ${book.referralCommission === option.value ? 'bg-indigo-100 font-semibold' : ''}`}
                      role="option"
                      aria-selected={book.referralCommission === option.value}
                      onClick={() => {
                        setBook({ ...book, referralCommission: option.value });
                        setDropdownOpen(false);
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                  <li className="px-4 py-2 flex items-center gap-2 border-t border-gray-100 bg-gray-50">
                    <span>Other:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="0.1"
                      className="w-20 rounded border px-2 py-1 text-sm border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200"
                      value={commissionOptions.some(opt => opt.value === book.referralCommission) ? '' : book.referralCommission || ''}
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setBook({ ...book, referralCommission: isNaN(val) ? 0 : val });
                      }}
                      placeholder="%"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  </li>
                </ul>
              )}
            </div>
            <label 
              htmlFor="referral-commission" 
              className={`absolute left-4 top-0 text-xs bg-white px-1 -translate-y-1/2 transition-colors ${
                errors.referralCommission ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              Referral Commission *
            </label>
          </div>
          {errors.referralCommission && (
            <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
              <span className="w-1 h-1 bg-red-600 rounded-full"></span>
              {errors.referralCommission}
            </p>
          )}
        </div>
      </div>

      {/* Price Comparison Info */}
      {book.sellingPrice && book.normalPrice && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Discount Amount:</span>
            <span className="font-medium text-green-600">
              ₦{(parseFloat(book.normalPrice) - parseFloat(book.sellingPrice)).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 mt-1">
            <span>Discount Percentage:</span>
            <span className="font-medium text-green-600">
              {(((parseFloat(book.normalPrice) - parseFloat(book.sellingPrice)) / parseFloat(book.normalPrice)) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}