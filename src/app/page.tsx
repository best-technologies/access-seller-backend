'use client';

import Hero from "@/components/home/Hero";
import FeaturedBooks from "@/components/home/FeaturedBooks";
import ReferralHighlight from "@/components/home/ReferralHighlight";
import NewArrivals from "@/components/home/NewArrivals";
import Categories from "@/components/home/Categories";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import Navbar from "@/components/home/Navbar";
import { useEffect, useState } from 'react';
import { api } from '@/services/api';

// Types for homepage featured books and categories
interface HomepageBook {
  id: string;
  book_name: string;
  author: string;
  description: string;
  selling_price: number;
  normal_price: number;
  display_image?: string;
  cover_image?: string;
  category?: { name: string }[];
}

interface HomepageCategory {
  id: string;
  name: string;
  description?: string;
  total_books: number;
  display_image?: string;
}

const HOMEPAGE_CACHE_KEY = 'homepage_products_cache';
const HOMEPAGE_CACHE_TIME = 60 * 60 * 1000; // 1 hour

export default function Home() {
  const [homepageData, setHomepageData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHomepageData = async () => {
      setLoading(true);
      const cached = typeof window !== 'undefined' ? localStorage.getItem(HOMEPAGE_CACHE_KEY) : null;
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < HOMEPAGE_CACHE_TIME) {
            console.log('[Homepage] Using cached homepage data', data);
            setHomepageData(data);
            setError(null);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Cache parse error:', e);
        }
      }
      try {
        const res = await api.public.getHomepageProducts();
        console.log('[Homepage] API response:', res);
        if (res.success) {
          setHomepageData(res.data);
          setError(null);
          if (typeof window !== 'undefined') {
            localStorage.setItem(HOMEPAGE_CACHE_KEY, JSON.stringify({ data: res.data, timestamp: Date.now() }));
          }
        } else {
          console.error('API did not return success:', res);
          setError('Failed to fetch homepage data.');
        }
      } catch (err) {
        console.error('[Homepage] Error fetching homepage data:', err);
        setError('Failed to fetch homepage data.');
      }
      setLoading(false);
    };
    fetchHomepageData();
  }, []);

  // Inline Book type from FeaturedBooks/NewArrivals
  type HomeBook = {
    id: string;
    title: string;
    author: string;
    desc: string;
    price: string;
    originalPrice?: string;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    badge?: 'Bestseller' | 'Trending' | 'Hot' | "Editor's Choice";
    discount?: number;
    isNew?: boolean;
    sellingPrice?: string;
    normalPrice?: string;
  };
  // Inline Category type from Categories
  type HomeCategory = {
    name: string;
    description?: string;
    image: string;
    count: string;
  };

  const mapBook = (book: HomepageBook): HomeBook => {
    return {
      id: book.id, // Use the string id from the API, not the index
      title: book.book_name,
      author: book.author,
      desc: book.description,
      price: String(book.selling_price),
      originalPrice: book.normal_price ? String(book.normal_price) : undefined,
      rating: 0,
      reviews: 0,
      image: book.display_image || book.cover_image || '/images/book-images/profit-first.png',
      category: Array.isArray(book.category) && book.category.length > 0 ? book.category[0].name : '',
    };
  };
  const mapCategory = (cat: HomepageCategory): HomeCategory => {
    return {
      name: cat.name,
      description: cat.description,
      image: cat.display_image || '/images/book-images/profit-first.png',
      count: (cat.total_books || 0) + ' Books',
    };
  };

  // Type guard for homepageData
  const getHomepageField = <T,>(key: string, fallback: T): T => {
    if (homepageData && typeof homepageData === 'object' && homepageData !== null && key in homepageData) {
      // @ts-expect-error: dynamic access
      return homepageData[key] as T;
    }
    return fallback;
  };

  const featuredBooks = getHomepageField<HomepageBook[]>('featured', []).map(mapBook);
  const newArrivals = getHomepageField<HomepageBook[]>('newArrivals', []).map(mapBook);
  const categories = getHomepageField<HomepageCategory[]>('popularCategories', []).map(mapCategory);
  const availableCategories = getHomepageField<HomepageCategory[]>('available_categories', []);

  console.log("Homepage data: ", homepageData)

  return (
    <>
      <Navbar />
      <Hero />
      
      {/* Featured Section with Background */}
      <section className="bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <FeaturedBooks books={featuredBooks} available_categories={availableCategories} loading={loading} error={error} />
        </div>
      </section>

      {/* New Arrivals with Pattern Background */}
      <section className="bg-[url('/pattern.svg')] bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <NewArrivals books={newArrivals} loading={loading} error={error} />
        </div>
      </section>

      {/* Categories with Gradient */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Categories categories={categories} loading={loading} error={error} />
        </div>
      </section>

      {/* Referral Section with Contrast */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <ReferralHighlight />
        </div>
      </section>

      

      {/* How It Works with Clean Background */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <HowItWorks />
        </div>
      </section>

      {/* Testimonials with Subtle Pattern */}
      <section className="bg-[url('/pattern.svg')] bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Testimonials />
        </div>
      </section>
    </>
  );
}
