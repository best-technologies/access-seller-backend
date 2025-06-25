"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
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

export default function ProductDetailPage() {
  const params = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAffiliateReferral, setIsAffiliateReferral] = useState(false);
  const [referralData, setReferralData] = useState<any>(null);
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
  // console.log('slug:', slug, 'productId:', productId);

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
        
        // Store referral data for checkout attribution
        localStorage.setItem('affiliate_referral', JSON.stringify(referralInfo));
        
        // Track affiliate click (you can add analytics here)
        console.log('Affiliate referral detected:', referralInfo);
      }
    }
  }, [productId]);

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
      .then((res) => {
        console.log('API response:', res);
        const d = res.data || res;
        // Normalize API response to match frontend expectations
        const normalized = {
          id: d.id,
          title: d.name,
          description: d.description,
          price: d.sellingPrice,
          originalPrice: d.normalPrice,
          amountSaved: d.amountSaved,
          stock: d.stock,
          images: d.images || [],
          category: d.category?.name || '',
          categoryId: d.categoryId,
          commission: d.commission,
          isActive: d.isActive,
          status: d.status,
          isbn: d.isbn,
          publisher: d.publisher,
          format: d.format || [],
          availableFormats: d.format || [],
          language: d.language || [],
          genre: d.genre || [],
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          // Fallbacks/defaults for fields not in API
          features: d.features || [
            "High quality print",
            "Available in multiple formats",
            "Bestseller in its category"
          ],
          rating: d.rating || 4.5,
          reviews: d.reviews || 0,
          specifications: d.specifications || {
            Publisher: d.publisher,
            ISBN: d.isbn,
            Language: (d.language || []).join(', '),
            Genre: (d.genre || []).join(', '),
            Format: (d.format || []).join(', '),
            "Commission Rate": d.commission ? `${d.commission}%` : undefined,
            "Stock": d.stock,
            "Created At": d.createdAt,
            "Updated At": d.updatedAt,
          },
          isNew: d.isNew || false,
        };
        setProduct(normalized);
        if (normalized.availableFormats.length) {
          setSelectedFormat(normalized.availableFormats[0]);
        }
      })
      .catch((err) => {
        console.error('API error:', err);
        setError("Book Not Found");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  // Check if affiliate link already exists for this product
  useEffect(() => {
    if (product && isAuthenticated && user?.is_affiliate && user?.affiliate_status === 'approved') {
      api.user.getAffiliateLinks()
        .then((res: any) => {
          if (res.success && res.data) {
            const existingLink = res.data.find((link: any) => link.productId === product.id);
            if (existingLink) {
              setAffiliateLink(existingLink.shareableLink || `${window.location.origin}/products/${existingLink.productId}?ref=${existingLink.slug}`);
            }
          }
        })
        .catch((error) => {
          console.log('Error checking existing affiliate links:', error);
        });
    }
  }, [product, isAuthenticated, user]);

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const cartItem = product ? cart.find(item => item.productId === String(product.id)) : null;
  const router = useRouter();

  const handleWishlistToggle = () => {
    if (!product) return;
    const productId = String(product.id);
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success(`${product.title || product.name} removed from wishlist`);
    } else {
      addToWishlist({
        id: productId,
        title: product.title || product.name,
        author: product.author,
        price: product.sellingPrice,
        image: product.images?.[0] || product.display_picture,
        category: product.category,
        rating: product.rating,
        reviews: product.reviews,
        originalPrice: product.originalPrice,
        discount: product.discount,
        isNew: product.isNew || product.is_new
      });
      toast.success(`${product.title || product.name} added to wishlist`);
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
        sellingPrice: product.sellingPrice ?? product.price,
        normalPrice: product.normalPrice ?? product.originalPrice ?? product.price,
        product: {
          name: product.title,
          image: product.images[0],
          category: product.category
        }
      });
      router.push('/checkout');
    }
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
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
        id: product.id,
        name: product.title,
        price: product.price,
        image: product.images[0],
        category: product.category
      },
      quantity,
      totalCost: product.price * quantity,
      shipping: shippingForm,
      referral: referralData,
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
      // api.orders.createAffiliateOrder(orderData);
      
    }, 2000);
  };

  const handleGenerateAffiliateLink = async () => {
    if (!product || !user?.is_affiliate) return;
    
    setIsGeneratingLink(true);
    try {
      const response: any = await api.user.generateAffiliateLink(product.id);
      if (response.success) {
        setAffiliateLink(response.data.shareableLink);
        toast.success('Affiliate link generated successfully!');
      } else {
        toast.error(response.message || 'Failed to generate affiliate link');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate affiliate link');
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
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return <Loader/>;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || "Book Not Found"}</h1>
          <Link href="/products">
            <Button variant="outline">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/products"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              
            </Link>
          </div>

          {/* Affiliate Referral Badge */}
          {isAffiliateReferral && (
            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-indigo-900">
                      You were referred by an affiliate partner
                    </p>
                    <p className="text-xs text-indigo-700">
                      Special commission offer available
                    </p>
                  </div>
                </div>
                <div className="bg-indigo-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Commissioned Offer
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 p-8">
              {/* Book Images */}
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={product.images[selectedImage]}
                    alt={product.title}
                    width={500}
                    height={667}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {product.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-[3/4] rounded-lg overflow-hidden border-2 ${
                        selectedImage === index
                          ? 'border-indigo-600'
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.title} - View ${index + 1}`}
                        width={125}
                        height={167}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Book Info */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {product.title}
                    </h1>
                    {/* Affiliate Promote Button - right of title */}
                    {isAuthenticated && user?.is_affiliate && user?.affiliate_status === 'approved' && (
                      <div className="flex items-center gap-2">
                        {affiliateLink ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-mono truncate max-w-[200px]" title={affiliateLink}>
                              {affiliateLink}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-600 hover:text-indigo-900 font-semibold shadow-sm transition-all text-sm px-3 py-1 rounded-lg"
                              onClick={handleCopyAffiliateLink}
                              disabled={linkCopied}
                            >
                              {linkCopied ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-4 w-4" />
                                  Copy Link
                                </>
                              )}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="flex items-center gap-2 border-indigo-500 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-600 hover:text-indigo-900 font-semibold shadow-sm transition-all text-base px-4 py-2 rounded-lg"
                            title="Generate affiliate link for this product"
                            onClick={handleGenerateAffiliateLink}
                            disabled={isGeneratingLink}
                          >
                            {isGeneratingLink ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                Generating...
                              </>
                            ) : (
                              <>
                                <Share2 className="h-5 w-5" />
                                Generate Affiliate Link
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xl text-gray-600 mb-4">
                    by {product.author}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
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

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ₦{product.price}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₦{product.originalPrice}
                      </span>
                      <span className="text-green-600 font-medium">
                        Save ₦{product.amountSaved}
                      </span>
                    </>
                  )}
                </div>

                <p className="text-gray-600">
                  {product.description}
                </p>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Available Formats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {product.availableFormats.map((format: string) => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                          selectedFormat === format
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {format === "E-Book" ? (
                          <BookOpen className="h-5 w-5" />
                        ) : format === "Audiobook" ? (
                          <Download className="h-5 w-5" />
                        ) : (
                          <Book className="h-5 w-5" />
                        )}
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Key Features</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-gray-600">
                        <Check className="h-5 w-5 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-50 rounded-l-lg"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center border-0 focus:ring-0"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-50 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.stock} units available
                    </span>
                  </div>

                  <div className="flex gap-4">
                    {cartItem ? (
                      <>
                        <Button variant="outline" className="flex-1" onClick={() => removeFromCart(String(product.id))}>
                          Remove from Cart
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => router.push('/cart')}>
                          Go to Cart
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Primary CTA - Buy Now for affiliate referrals, Add to Cart for regular traffic */}
                        {isAffiliateReferral ? (
                          <Button 
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg py-3" 
                            onClick={handleBuyNow}
                          >
                            🚀 Buy Now - Secure Checkout
                          </Button>
                        ) : (
                          <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => addToCart({
                            productId: String(product.id),
                            quantity,
                            price: product.price,
                            sellingPrice: product.sellingPrice ?? product.price,
                            normalPrice: product.normalPrice ?? product.originalPrice ?? product.price,
                            product: {
                              name: product.title,
                              image: product.images[0],
                              category: product.category
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
                            className={`flex-1 ${isInWishlist(String(product.id)) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}`}
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
                    <div className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800 font-medium">
                        ⚡ Limited time offer! This commission deal expires soon.
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Truck className="h-5 w-5" />
                    <span>{product.shipping}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-5 w-5" />
                    <span>Delivery: {product.delivery}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Shield className="h-5 w-5" />
                    <span>30-Day Return Policy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="border-t border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Book Details
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex">
                    <span className="w-1/3 text-gray-500">{key}</span>
                    <span className="w-2/3 text-gray-900">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address Modal */}
      {showShippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Shipping Information</h3>
              <button
                onClick={() => setShowShippingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Enter your complete shipping address"
                    required
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>{product.title}</span>
                      <span>₦{product.price}</span>
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

                <div className="flex gap-3 pt-4">
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
      )}
    </>
  );
} 