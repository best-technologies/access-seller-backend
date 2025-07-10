import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, BookOpen, Users, Percent, Clock } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0">
        <Image 
          src="/images/book-images/mockup-2.png"
          alt="Hero background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-indigo-900/90 to-blue-900/95" />
      
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Column - Main Content */}
            <div className="text-left">
              <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-200 text-sm font-medium mb-6">
                Your Trusted Book Destination
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
                Discover Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Favorite Book</span>
              </h1>
              <p className="text-lg text-gray-200 mb-8">
                Explore our curated collection of bestselling books. Share with friends and earn rewards on every purchase.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button 
                    size="lg" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg rounded-full px-8 font-medium group min-w-[200px] whitespace-nowrap"
                  >
                    Start Shopping
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/about-referrals">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white/10 hover:bg-white/20 text-white border-white/50 hover:border-white rounded-full px-8 font-medium min-w-[200px] whitespace-nowrap"
                  >
                    Learn About Referrals
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="mt-12 grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <BookOpen className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">10K+</div>
                    <div className="text-sm text-gray-300">Books Available</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Users className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">5K+</div>
                    <div className="text-sm text-gray-300">Happy Readers</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Percent className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">15%</div>
                    <div className="text-sm text-gray-300">Referral Bonus</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/20">
                    <Clock className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-sm text-gray-300">Support</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Feature Cards */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <div className="aspect-square relative rounded-xl overflow-hidden mb-3">
                  <Image 
                    src="/images/book-images/profit-first.png"
                    alt="Bestseller Book"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <h3 className="text-white font-semibold mb-1">Bestsellers</h3>
                <p className="text-sm text-gray-300">Top rated books this month</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 mt-8">
                <div className="aspect-square relative rounded-xl overflow-hidden mb-3">
                  <Image 
                    src="/images/book-images/ecommerce-book-cover.png"
                    alt="New Release Book"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <h3 className="text-white font-semibold mb-1">New Releases</h3>
                <p className="text-sm text-gray-300">Fresh content weekly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
