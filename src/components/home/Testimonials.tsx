'use client';

import { Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Book Enthusiast",
    avatar: "",
    rating: 5,
    text: "I've discovered so many amazing books through this platform. The referral program is fantastic - I've earned enough to fund my entire reading habit!",
    location: "New York, USA"
  },
  {
    name: "Michael Chen",
    role: "Content Creator",
    avatar: "",
    rating: 5,
    text: "As a book reviewer, I love recommending books to my audience. The referral system makes it even better - I can earn while sharing my passion.",
    location: "London, UK"
  },
  {
    name: "Emma Rodriguez",
    role: "Student",
    avatar: "",
    rating: 4.5,
    text: "Perfect for students! I've found all my textbooks here and earned back some of my expenses through referrals. The selection is incredible.",
    location: "Toronto, Canada"
  }
];

export default function Testimonials() {
  return (
    <div className="py-8 sm:py-16 px-4 sm:px-0">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">What Our Readers Say</h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Join thousands of satisfied readers who have found their next favorite book and earned rewards
        </p>
      </div>

      <div className="flex overflow-x-auto pb-6 gap-3 px-4 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-6 sm:mb-12">
        {testimonials.map((t, i) => (
          <div key={i} className="relative min-w-[240px] sm:min-w-0">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="absolute -top-3 left-4 sm:-top-4 sm:left-6 w-6 h-6 sm:w-8 sm:h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <Quote className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-indigo-100">
                  <Image 
                    src={t.avatar} 
                    alt={t.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base">{t.name}</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500">{t.role}</p>
                  <p className="text-[8px] sm:text-[10px] text-gray-400">{t.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 mb-2 sm:mb-3">
                {[...Array(Math.floor(t.rating))].map((_, j) => (
                  <Star key={j} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                ))}
                {t.rating % 1 !== 0 && (
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400 opacity-50" />
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3 sm:line-clamp-none">&quot;{t.text}&quot;</p>

              <div className="flex items-center text-indigo-600 text-[10px] sm:text-xs font-medium">
                Read full review
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-4">
        <Button variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base">
          View All Reviews
        </Button>
      </div>
    </div>
  );
}
