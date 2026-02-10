import { Star, Check, Book, BookOpen, Download, Copy, Share2, X, Facebook, Twitter, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import React, { useState, useRef } from "react";
import type { ProductUI } from '@/types/product';
import type { User as UserBase } from '@/services/api';
import { stripHtmlTags } from '@/lib/utils';

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
  const [showSharePopover, setShowSharePopover] = useState(false);
  const shareBtnRef = useRef<HTMLButtonElement>(null);

  // Helper for social share URLs
  const getShareUrl = (platform: string) => {
    if (!affiliateLink) return "#";
    const encoded = encodeURIComponent(affiliateLink);
    const text = encodeURIComponent(`Check this out: ${affiliateLink}`);
    switch (platform) {
      case "whatsapp":
        return `https://wa.me/?text=${text}`;
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encoded}&text=Check%20this%20out!`;
      case "telegram":
        return `https://t.me/share/url?url=${encoded}&text=Check%20this%20out!`;
      default:
        return "#";
    }
  };

  // Native share API
  const handleNativeShare = async () => {
    if (navigator.share && affiliateLink) {
      try {
        await navigator.share({
          title: "Check this out!",
          text: "Check out this book:",
          url: affiliateLink,
        });
        setShowSharePopover(false);
      } catch {}
    }
  };

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
              <div className="flex gap-2 relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-indigo-500 text-indigo-700 hover:bg-indigo-50"
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
                <Button
                  ref={shareBtnRef}
                  variant="outline"
                  size="sm"
                  className="flex-1 border-indigo-500 text-indigo-700 hover:bg-indigo-50 relative"
                  onClick={() => setShowSharePopover(v => !v)}
                  disabled={!affiliateLink}
                  type="button"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                {/* Share Popover */}
                {showSharePopover && (
                  <div className="absolute z-50 mt-12 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-2 min-w-[180px]" style={{ top: '100%', right: 0 }}>
                    {/* <div className="text-xs text-red-500">DEBUG: Popover is rendered</div> */}
                    <button className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600" onClick={() => setShowSharePopover(false)}><X className="h-4 w-4" /></button>
                    <span className="text-xs text-gray-700 mb-1 font-semibold">Share via</span>
                    <a href={getShareUrl("whatsapp")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-green-50 text-green-700 text-sm"
                      onClick={() => setShowSharePopover(false)}
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                    <a href={getShareUrl("facebook")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-50 text-blue-700 text-sm"
                      onClick={() => setShowSharePopover(false)}
                    >
                      <Facebook className="h-4 w-4" /> Facebook
                    </a>
                    <a href={getShareUrl("twitter")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-sky-50 text-sky-700 text-sm"
                      onClick={() => setShowSharePopover(false)}
                    >
                      <Twitter className="h-4 w-4" /> Twitter
                    </a>
                    <a href={getShareUrl("telegram")}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-50 text-blue-700 text-sm"
                      onClick={() => setShowSharePopover(false)}
                    >
                      <Send className="h-4 w-4" /> Telegram
                    </a>
                    {typeof navigator.share === 'function' && (
                      <button
                        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 text-gray-700 text-sm w-full"
                        onClick={handleNativeShare}
                      >
                        <Share2 className="h-4 w-4" /> More...
                      </button>
                    )}
                  </div>
                )}
              </div>
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
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{stripHtmlTags(product.description)}</p>
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