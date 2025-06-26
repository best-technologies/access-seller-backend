"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { 
  ArrowLeft, 
  Star, 
  Heart, 
  ShoppingCart, 
  Truck, 
  Shield, 
  Clock,
  Book,
  BookOpen,
  Download,
  Check,
  X,
  Copy,
  Share2
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import GeneralNavbar from "@/components/GeneralNavbar";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import toast from "react-hot-toast";
import { api } from '@/services/api';
import Loader from "@/components/Loader";
import { useAuth } from "@/context/AuthContext";
import type { Product as ProductApi } from '@/types/product';

interface ProductUI {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  amountSaved?: number;
  stock: number;
  images: string[];
  category: string;
  categoryId?: string;
  commission?: number;
  isActive?: boolean;
  status?: string;
  isbn?: string;
  publisher?: string;
  format?: string[];
  availableFormats?: string[];
  language?: string[];
  genre?: string[];
  createdAt?: string;
  updatedAt?: string;
  features?: string[];
  rating?: number;
  reviews?: number;
  specifications?: Record<string, string>;
  isNew?: boolean;
  author?: string;
  discount?: number;
}

type AffiliateLink = {
  id: string;
  productId: string;
  slug: string;
  clicks: number;
  orders: number;
  commission: number;
  product: {
    name: string;
    displayImages?: Array<{ secure_url: string }>;
    commission: number;
    sellingPrice: number;
    status: string;
  };
};

export default function ProductDetailPage() {
  const params = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductUI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAffiliateReferral, setIsAffiliateReferral] = useState(false);
  const [referralData, setReferralData] = useState<Record<string, unknown> | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Extract product ID from slug
  const slug = params?.slug as string;
  const productId = slug && slug.includes('-') ? slug.substring(0, slug.indexOf('-')) : slug || null;

  // Detect affiliate referral
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refId = urlParams.get('ref');
      
      if (refId) {
        setIsAffiliateReferral(true);
        const referralInfo = {
          refId,
          productId,
          timestamp: Date.now(),
          url: window.location.href
        };
        setReferralData(referralInfo);
        
        localStorage.setItem('affiliate_referral', JSON.stringify(referralInfo));
        console.log('Affiliate referral detected:', referralInfo);
      }
    }
  }, [productId, product]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log("User auth check: ", user)
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    console.log('Calling getSingleProduct with id:', productId);
    api.public.getSingleProduct(productId)
      .then((d: ProductApi) => {
        console.log('API response:', d);
        if (!d) {
          setError('Book Not Found');
          setLoading(false);
          return;
        }
        // Normalize API response to match frontend expectations
        let specifications: Record<string, string> = {};
        if ('specifications' in d && d.specifications) {
          const specs = d.specifications as Record<string, string | string[]>;
          specifications = {
            ...specs,
            Language: Array.isArray(specs.Language) ? specs.Language.join(', ') : (specs.Language || ''),
            Genre: Array.isArray(specs.Genre) ? specs.Genre.join(', ') : (specs.Genre || ''),
            Format: Array.isArray(specs.Format) ? specs.Format.join(', ') : (specs.Format || ''),
          };
        } else {
          specifications = {
            Publisher: String((d as { publisher?: string }).publisher || ''),
            ISBN: String((d as { isbn?: string }).isbn || ''),
            Language: Array.isArray((d as { language?: unknown }).language)
              ? ((d as { language?: string[] }).language ?? []).join(', ')
              : typeof (d as { language?: unknown }).language === 'string'
                ? (d as { language?: string }).language || ''
                : '',
            Genre: Array.isArray((d as { genre?: unknown }).genre)
              ? ((d as { genre?: string[] }).genre ?? []).join(', ')
              : typeof (d as { genre?: unknown }).genre === 'string'
                ? (d as { genre?: string }).genre || ''
                : '',
            Format: Array.isArray((d as { format?: unknown }).format)
              ? ((d as { format?: string[] }).format ?? []).join(', ')
              : typeof (d as { format?: unknown }).format === 'string'
                ? (d as { format?: string }).format || ''
                : '',
            "Commission Rate": String((d as { commission?: number }).commission ? `${(d as { commission?: number }).commission}%` : ''),
            "Stock": String((d as { stock?: number }).stock?.toString() || ''),
            "Created At": d.createdAt ? (d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt)) : '',
            "Updated At": d.updatedAt ? (d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt)) : '',
          };
        }
        const normalized: ProductUI = {
          id: d.id,
          title: String((d as { title?: string }).title || (d as { bookName?: string }).bookName || (d as { name?: string }).name || ''),
          description: d.description || '',
          price: (d as { sellingPrice?: number }).sellingPrice ?? d.price ?? 0,
          originalPrice: (d as { normalPrice?: number }).normalPrice ?? undefined,
          amountSaved: (d as { amountSaved?: number }).amountSaved ?? undefined,
          stock: (d as { stock?: number }).stock ?? 0,
          images: d.images || (d as { displayImages?: string[] }).displayImages || [],
          category: typeof d.category === 'object' && d.category !== null && typeof (d.category as { name?: string }).name === 'string'
            ? String((d.category as { name: string }).name)
            : (typeof d.category === 'string' ? String(d.category) : ''),
          categoryId: String((d as { categoryId?: string }).categoryId || ''),
          commission: (d as { commission?: number }).commission ?? 0,
          isActive: (d as { isActive?: boolean }).isActive ?? false,
          status: String((d as { status?: string }).status || ''),
          isbn: String((d as { isbn?: string }).isbn || ''),
          publisher: String((d as { publisher?: string }).publisher || ''),
          format: (d as { format?: string[] }).format || [],
          availableFormats: (d as { format?: string[] }).format || [],
          language: (d as { language?: string[] }).language || [],
          genre: (d as { genre?: string[] }).genre || [],
          createdAt: d.createdAt ? (d.createdAt instanceof Date ? d.createdAt.toISOString() : String(d.createdAt)) : '',
          updatedAt: d.updatedAt ? (d.updatedAt instanceof Date ? d.updatedAt.toISOString() : String(d.updatedAt)) : '',
          features: (d as { features?: string[] }).features || [
            "High quality print",
            "Available in multiple formats",
            "Bestseller in its category"
          ],
          rating: (d as { rating?: number }).rating || 4.5,
          reviews: (d as { reviews?: number }).reviews || 0,
          specifications,
          isNew: (d as { isNew?: boolean }).isNew || false,
          author: (product as ProductUI)?.author || '',
          discount: (d as { discount?: number }).discount ?? 0,
        };
        setProduct(normalized);
        if (normalized.availableFormats && normalized.availableFormats.length) {
          setSelectedFormat(normalized.availableFormats[0]);
        }
      })
      .catch((err: unknown) => {
        console.error('API error:', err);
        setError("Book Not Found");
      })
      .finally(() => setLoading(false));
  }, [productId, product]);

  // Check if affiliate link already exists for this product
  useEffect(() => {
    if (product && isAuthenticated && user?.is_affiliate && user?.affiliate_status === 'approved') {
      api.user.getAffiliateLinks()
        .then((res) => {
          const result = res as unknown as { success: boolean; data: AffiliateLink[] };
          if (result.success && result.data) {
            const existingLink = result.data.find((link: AffiliateLink) => link.productId === product?.id);
            if (existingLink) {
              setAffiliateLink((existingLink as { shareableLink?: string }).shareableLink || `${window.location.origin}/products/${existingLink.productId}?ref=${existingLink.slug}`);
            }
          }
        })
        .catch((error: unknown) => {
          console.log('Error checking existing affiliate links:', error);
        });
    }
  }, [product, isAuthenticated, user]);

  const { cart, addToCart, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const cartItem = product ? cart.find(item => item.productId === String(product.id)) : null;
  const router = useRouter();

  const handleWishlistToggle = () => {
    if (!product) return;
    const productId = String(product.id);
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success(`${product?.title} removed from wishlist`);
    } else {
      addToWishlist({
        id: productId,
        title: product?.title,
        author: (product as ProductUI)?.author || '',
        price: (product as ProductUI)?.price,
        image: (product as ProductUI)?.images?.[0] ?? '',
        category: product?.category,
        rating: product?.rating,
        reviews: product?.reviews,
        originalPrice: product?.originalPrice,
        discount: product?.discount,
        isNew: product?.isNew || false
      });
      toast.success(`${product?.title} added to wishlist`);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    if (isAffiliateReferral) {
      setShowShippingModal(true);
    } else {
      // Regular flow - add to cart and go to checkout
      addToCart({
        productId: String(product.id),
        quantity,
        price: product.price,
        sellingPrice: (product as ProductUI).price ?? product.price,
        normalPrice: (product as ProductUI).originalPrice ?? product.originalPrice ?? product.price,
        product: {
          name: String(product?.title || ''),
          image: String((product as ProductUI)?.images[0] ?? ''),
          category: String(product?.category || '')
        }
      });
      router.push('/checkout');
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!shippingForm.name || !shippingForm.email || !shippingForm.phone || !shippingForm.address) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingForm.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone validation (basic)
    if (shippingForm.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsProcessingPayment(true);

    // Prepare order data
    const orderData = {
      product: {
        id: product?.id,
        name: String(product?.title || ''),
        price: product?.price ?? 0,
        image: String((product as ProductUI)?.images[0] ?? ''),
        category: String(product?.category || '')
      },
      quantity,
      totalCost: (product?.price ?? 0) * quantity,
      shipping: String(shippingForm ?? ''),
      referral: String(referralData ?? ''),
      timestamp: new Date().toISOString()
    };

    console.log('Processing affiliate order:', orderData);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowShippingModal(false);
      setShippingForm({ name: '', email: '', phone: '', address: '' });
      
      // Show success message
      toast.success('🎉 Order successfully paid! Thank you for your purchase.');
      
      // Here you would typically send the orderData to your backend
      // api.orders?.createAffiliateOrder?.(orderData);
      
    }, 2000);
  };

  const handleGenerateAffiliateLink = async () => {
    if (!product || !user?.is_affiliate) return;
    
    setIsGeneratingLink(true);
    try {
      const response = await api.user.generateAffiliateLink(product.id);
      const result = response as unknown as { success: boolean; data: { shareableLink: string }; message?: string };
      if (result.success) {
        setAffiliateLink(result.data.shareableLink);
        toast.success('Affiliate link generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate affiliate link');
      }
    } catch {
      toast.error('Failed to generate affiliate link');
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyAffiliateLink = async () => {
    if (!affiliateLink) return;
    
    try {
      await navigator.clipboard.writeText(affiliateLink);
      setLinkCopied(true);
      toast.success('Affiliate link copied to clipboard!');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return <Loader/>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4">{error || "Book Not Found"}</h1>
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  console.log("originalPrice:", product.originalPrice, "price:", product.price);

  return (
    <>
      <GeneralNavbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6 lg:py-8">
          {/* Breadcrumb */}
          <div className="mb-3 sm:mb-6">
            <Link 
              href="/products"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 text-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
            </Link>
          </div>

          {/* Affiliate Referral Badge */}
          {isAffiliateReferral && (
            <div className="mb-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-indigo-900">
                    You were referred by an affiliate partner
                  </p>
                  <p className="text-xs text-indigo-700">
                    Special commission offer available
                  </p>
                </div>
                <div className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                  Commissioned
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Mobile-first layout */}
            <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-8">
              
              {/* Book Images - Mobile optimized */}
              <div className="order-1 p-4 sm:p-6 lg:p-8">
                {/* Main image */}
                <div className="mb-3">
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 max-w-sm mx-auto lg:max-w-none lg:mx-0">
                    <Image
                      src={product.images[selectedImage]}
                      alt={product.title}
                      width={400}
                      height={533}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>
                
                {/* Thumbnail images */}
                <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto lg:max-w-none lg:mx-0">
                  {product.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-[3/4] rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImage === index
                          ? 'border-indigo-600'
                          : 'border-gray-200'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} - View ${index + 1}`}
                        width={80}
                        height={107}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Info - Mobile optimized */}
              <div className="order-2 p-4 sm:p-6 lg:p-8 space-y-4">
                
                {/* Title and Affiliate Link Section */}
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
                    {product.title}
                  </h1>
                  
                  {/* Mobile-optimized Affiliate Link Section */}
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
                  
                  <p className="text-base sm:text-lg text-gray-600 mb-3">
                    by {product.author}
                  </p>
                  
                  {/* Rating and badges */}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="ml-1 text-gray-600">{product.rating}</span>
                    </div>
                    <span className="text-gray-500">
                      {product.reviews} reviews
                    </span>
                    {product.isNew && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        New
                      </span>
                    )}
                    {isAffiliateReferral && (
                      <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        🔥 Selling Fast!
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ₦{product.price}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ₦{product.originalPrice}
                      </span>
                      <span className="text-green-600 font-medium text-sm">
                        Save ₦{product.amountSaved}
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Available Formats */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Available Formats</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {(product?.availableFormats ?? []).map((format: string) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors text-sm ${
                          selectedFormat === format
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
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

                {/* Quantity and Actions */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-50 rounded-l-lg text-lg font-medium"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center border-0 focus:ring-0 text-base"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-50 rounded-r-lg text-lg font-medium"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.stock} units available
                    </span>
                  </div>

                  {/* Action Buttons - Mobile optimized */}
                  <div className="space-y-3">
                    {cartItem ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => removeFromCart(String(product.id))}>
                          Remove from Cart
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/cart')}>
                          Go to Cart
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Primary CTA */}
                        {isAffiliateReferral ? (
                          <Button 
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 text-base" 
                            onClick={handleBuyNow}
                          >
                            🚀 Buy Now - Secure Checkout
                          </Button>
                        ) : (
                          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3" onClick={() => addToCart({
                            productId: String(product.id),
                            quantity,
                            price: product.price,
                            sellingPrice: (product as ProductUI).price ?? product.price,
                            normalPrice: (product as ProductUI).originalPrice ?? product.originalPrice ?? product.price,
                            product: {
                              name: String(product?.title || ''),
                              image: String((product as ProductUI)?.images[0] ?? ''),
                              category: String(product?.category || '')
                            }
                          })}>
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Add to Cart
                          </Button>
                        )}
                        
                        {/* Secondary CTA - Only show for non-affiliate traffic */}
                        {!isAffiliateReferral && (
                          <Button 
                            variant="outline" 
                            className={`w-full py-3 ${isInWishlist(String(product.id)) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}`}
                            onClick={handleWishlistToggle}
                          >
                            <Heart className={`h-5 w-5 mr-2 ${isInWishlist(String(product.id)) ? 'fill-current' : ''}`} />
                            {isInWishlist(String(product.id)) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Affiliate urgency message */}
                  {isAffiliateReferral && (
                    <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium">
                        ⚡ Limited time offer! This commission deal expires soon.
                      </p>
                    </div>
                  )}
                </div>

                {/* Shipping & Policy Info */}
                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Truck className="h-4 w-4 flex-shrink-0" />
                    <span>{String((product as { shipping?: string }).shipping ?? '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span>Delivery: {String((product as { delivery?: string }).delivery ?? '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="h-4 w-4 flex-shrink-0" />
                    <span>30-Day Return Policy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications - Full width */}
            <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                Book Details
              </h2>
              <div className="space-y-3">
                {Object.entries(product?.specifications ?? {}).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-500 mb-1 sm:mb-0 sm:w-1/3">{key}</span>
                    <span className="text-sm text-gray-900 sm:w-2/3">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-optimized Shipping Address Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-lg w-full sm:w-full sm:max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-xl sm:rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Shipping Information</h3>
                <button
                  onClick={() => setShowShippingModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {isProcessingPayment ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Processing Payment...</p>
                  <p className="text-sm text-gray-600">Please wait while we secure your order</p>
                </div>
              ) : (
                <form onSubmit={handleShippingSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={shippingForm.name}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={shippingForm.email}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Shipping Address *
                    </label>
                    <textarea
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      rows={3}
                      placeholder="Enter your complete shipping address"
                      required
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="truncate">{product.title}</span>
                        <span className="flex-shrink-0">₦{product.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity</span>
                        <span>{quantity}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium">
                        <span>Total</span>
                        <span>₦{product.price * quantity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowShippingModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!shippingForm.name || !shippingForm.email || !shippingForm.phone || !shippingForm.address}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}