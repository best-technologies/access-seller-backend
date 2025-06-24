'use client';

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

interface CategoriesProps {
  categories: any[];
}

export default function Categories({ categories = [] }: CategoriesProps) {
  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12">
        <div className="mb-4 sm:mb-0">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">Popular Categories</h2>
          <p className="text-sm sm:text-base text-gray-600">Browse through our extensive collection of books</p>
        </div>
        <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base">
          All Categories
          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
        </Button>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-3 px-4 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
        {categories.map((cat) => (
          <Card key={cat.name} className="group relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px] sm:min-w-0">
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
                    <Button size="sm" className="bg-white text-indigo-600 hover:bg-gray-100 rounded-full h-6 sm:h-8 text-xs sm:text-sm px-2 sm:px-3">
                      Explore
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
