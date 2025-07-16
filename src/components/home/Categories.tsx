'use client';

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Loader } from "@/components/ui/loader";

interface Category {
  name: string;
  description?: string;
  image: string;
  count: string;
}

interface CategoriesProps {
  categories: Category[];
  loading?: boolean;
  error?: string | null;
}

export default function Categories({ categories = [], loading = false, error = null }: CategoriesProps) {
  // Debug: log categories data
  console.log("Categories data:", categories);
  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Popular Categories</h2>
          <p className="text-sm sm:text-base text-gray-600">Browse through our extensive collection of books</p>
        </div>
        {/* <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base">
          All Categories
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        </Button> */}
      </div>
      {/* Only the row and gradients are wrapped in relative */}
      <div className="relative w-full">
        <div className="flex overflow-x-auto pb-6 gap-3 px-2 sm:px-0 scrollbar-hide scroll-smooth w-full">
          {loading ? (
            <div className="flex justify-center items-center w-full min-h-[200px]"><Loader size="lg" variant="primary" /></div>
          ) : error ? (
            <div className="flex justify-center items-center w-full min-h-[200px] text-red-500">{error}</div>
          ) : categories.length === 0 ? (
            <div className="flex justify-center items-center w-full min-h-[200px] text-gray-500">No categories at the moment.</div>
          ) : (
            categories.map((cat) => (
              <Card key={cat.name} className="group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]">
                <div className="aspect-square w-full bg-gray-100 relative overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image 
                      src={cat.image} 
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute inset-0 p-3 sm:p-6 flex flex-col justify-end">
                    <div className="text-white">
                      <h3 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2">{cat.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-200 mb-2 sm:mb-3">{cat.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium">{cat.count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        {/* Gradient Fade Effects */}
        <div className="hidden sm:block pointer-events-none absolute right-0 top-0 bottom-8 w-32 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />
        <div className="hidden sm:block pointer-events-none absolute left-0 top-0 bottom-8 w-32 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
      </div>
    </div>
  );
}
