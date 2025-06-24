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
import Loader from "@/components/Loader";

export default function Home() {
  const HOMEPAGE_CACHE_KEY = 'homepage_products_cache';
  const HOMEPAGE_CACHE_TIME = 60 * 60 * 1000; // 1 hour

  const [homepageData, setHomepageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
          if (typeof window !== 'undefined') {
            localStorage.setItem(HOMEPAGE_CACHE_KEY, JSON.stringify({ data: res.data, timestamp: Date.now() }));
          }
        } else {
          console.error('API did not return success:', res);
        }
      } catch (err) {
        console.error('[Homepage] Error fetching homepage data:', err);
      }
      setLoading(false);
    };
    fetchHomepageData();
  }, []);

  if (loading) return <Loader/>;

  // Map API data to UI component shape
  const mapBook = (book: any) => ({
    id: book.id || book.book_name + (book.author || ''),
    title: book.book_name,
    author: book.author,
    desc: book.description,
    price: book.selling_price,
    originalPrice: book.normal_price,
    image: book.display_image || book.cover_image || '/images/book-images/profit-first.png', // fallback
    category: Array.isArray(book.category) && book.category.length > 0 ? book.category[0].name : '',
    // Add more fields as needed
  });
  const mapCategory = (cat: any) => ({
    id: cat.id,
    name: cat.name,
    description: cat.description,
    count: cat.total_books + ' Books',
    image: cat.display_image,
  });

  const featuredBooks = (homepageData?.featured || []).map(mapBook);
  const newArrivals = (homepageData?.newArrivals || []).map(mapBook);
  const categories = (homepageData?.popularCategories || []).map(mapCategory);

  console.log("Homepage data: ", homepageData)

  return (
    <>
      <Navbar />
      <Hero />
      
      {/* Featured Section with Background */}
      <section className="bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <FeaturedBooks books={featuredBooks} available_categories={homepageData?.available_categories || []} />
        </div>
      </section>

      {/* New Arrivals with Pattern Background */}
      <section className="bg-[url('/pattern.svg')] bg-opacity-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <NewArrivals books={newArrivals} />
        </div>
      </section>

      {/* Categories with Gradient */}
      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <Categories categories={categories} />
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
