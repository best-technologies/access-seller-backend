import { Star, Check, Book, BookOpen, Download, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import type { ProductUI } from '@/types/product';
import type { User as UserBase } from '@/services/api';

interface ProductInfoProps {
  product: ProductUI;
  selectedFormat: string | null;
  setSelectedFormat: (format: string) => void;
  isAuthenticated: boolean;
  user: UserBase | null;
  affiliateLink: string | null;
  isGeneratingLink: boolean;
  linkCopied: boolean;
  handleCopyAffiliateLink: () => void;
  handleGenerateAffiliateLink: () => void;
  isAffiliateReferral: boolean;
}

export default function ProductInfo({
  product,
  selectedFormat,
  setSelectedFormat,
  isAuthenticated,
  user,
  affiliateLink,
  isGeneratingLink,
  linkCopied,
  handleCopyAffiliateLink,
  handleGenerateAffiliateLink,
  isAffiliateReferral
}: ProductInfoProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
        {product.title}
      </h1>
      {/* Affiliate Link Section */}
      {isAuthenticated && user?.is_affiliate && user?.affiliate_status === 'approved' && (
        <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-indigo-900">Affiliate Promotion</span>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
          </div>
          {affiliateLink ? (
            <div className="space-y-2">
              <div className="bg-white p-2 rounded border text-xs font-mono text-gray-600 break-all">
                {affiliateLink}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-indigo-500 text-indigo-700 hover:bg-indigo-50"
                onClick={handleCopyAffiliateLink}
                disabled={linkCopied}
              >
                {linkCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-indigo-500 text-indigo-700 hover:bg-indigo-50"
              onClick={handleGenerateAffiliateLink}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Affiliate Link
                </>
              )}
            </Button>
          )}
        </div>
      )}
      <p className="text-base sm:text-lg text-gray-600 mb-3">by {product.author}</p>
      {/* Rating and badges */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="flex items-center">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="ml-1 text-gray-600">{product.rating}</span>
        </div>
        <span className="text-gray-500">{product.reviews} reviews</span>
        {product.isNew && (
          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">New</span>
        )}
        {isAffiliateReferral && (
          <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">🔥 Selling Fast!</span>
        )}
      </div>
      {/* Pricing */}
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-gray-900">₦{product.price}</span>
        {product.originalPrice && (
          <>
            <span className="text-lg text-gray-500 line-through">₦{product.originalPrice}</span>
            <span className="text-green-600 font-medium text-sm">Save ₦{product.amountSaved}</span>
          </>
        )}
      </div>
      {/* Description */}
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{product.description}</p>
      {/* Available Formats */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Available Formats</h3>
        <div className="grid grid-cols-1 gap-2">
          {(product?.availableFormats ?? []).map((format: string) => (
            <button
              key={format}
              onClick={() => setSelectedFormat(format)}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm ${selectedFormat === format ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-200 hover:border-gray-300'}`}
            >
              {format === "E-Book" ? (
                <BookOpen className="h-4 w-4" />
              ) : format === "Audiobook" ? (
                <Download className="h-4 w-4" />
              ) : (
                <Book className="h-4 w-4" />
              )}
              {format}
            </button>
          ))}
        </div>
      </div>
      {/* Key Features */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Key Features</h3>
        <ul className="space-y-2">
          {(product?.features ?? []).map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 