import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

export interface SearchSuggestion {
  id: string;
  title: string;
  author: string;
  image: string;
  slug: string;
}

interface ProductSearchBarProps {
  placeholder?: string;
  onSubmit?: (query: string) => void;
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  className?: string;
}

export default function ProductSearchBar({
  placeholder = "Search for books, authors, or ISBN...",
  onSubmit,
  onSelectSuggestion,
  className = "",
}: ProductSearchBarProps) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const fetchSearchSuggestions = async (query: string) => {
    return api.public.getSearchSuggestions(query);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    setShowSuggestions(!!value && value.length >= 2);
    setHighlighted(-1);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (value.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }
    setIsLoadingSuggestions(true);
    debounceTimeout.current = setTimeout(async () => {
      const results = await fetchSearchSuggestions(value);
      setSuggestions(results);
      setIsLoadingSuggestions(false);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearch("");
    setShowSuggestions(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    } else {
      router.push(`/products/${suggestion.slug}`);
    }
  };

  const handleInputBlur = (_e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => setShowSuggestions(false), 120);
  };

  const handleInputFocus = (_e?: React.FocusEvent<HTMLInputElement>) => {
    if (search.length >= 2 && suggestions.length > 0) setShowSuggestions(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (highlighted >= 0 && highlighted < suggestions.length) {
        handleSuggestionClick(suggestions[highlighted]);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const query = search.trim();
    if (!query) return;
    setShowSuggestions(false);
    setSearch("");
    if (onSubmit) {
      onSubmit(query);
    } else {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className={`relative w-full max-w-lg ${className}`}
      role="search"
      aria-label="Site search"
      autoComplete="off"
    >
      <input
        type="text"
        value={search}
        onChange={handleSearchChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 pr-12 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white text-gray-800 placeholder-gray-400 shadow-sm transition"
        aria-label={placeholder}
        ref={inputRef}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow transition"
        aria-label="Search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" /></svg>
      </button>
      {showSuggestions && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto animate-fade-in">
          {isLoadingSuggestions ? (
            <div className="p-4 text-center text-gray-400 text-sm">Searching...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">No results found</div>
          ) : suggestions.map((s, i) => (
            <div
              key={s.id}
              onMouseDown={() => handleSuggestionClick(s)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${highlighted === i ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
            >
              <img src={s.image} alt={s.title} className="w-10 h-14 object-cover rounded shadow" />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-sm line-clamp-1">{s.title}</div>
                <div className="text-xs text-gray-500 line-clamp-1">{s.author}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
} 