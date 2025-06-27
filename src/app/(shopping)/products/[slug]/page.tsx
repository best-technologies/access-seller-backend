"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
 
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
import "@todak2000/nigeria-state-lga-react-component/build/index.css";
import type { User as UserBase } from '@/services/api';
import ProductImages from '@/components/product/ProductImages';
import ProductInfo from '@/components/product/ProductInfo';
import QuantitySelector from '@/components/product/QuantitySelector';
import ProductSpecifications from '@/components/product/ProductSpecifications';
import ShippingModal from '@/components/product/ShippingModal';
import { formatAmount } from "@/lib/utils";

type User = UserBase & { phone?: string };

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
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    houseAddress: '',
    address: ''
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [affiliateLink, setAffiliateLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const typedUser = user as User | null;
  const [showOrderComplete, setShowOrderComplete] = useState(false);
  const [showCreateAccountPrompt, setShowCreateAccountPrompt] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [showAccountCreated, setShowAccountCreated] = useState(false);

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
  }, [productId]);

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

  console.log("Product-price: ", product?.price)

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
    if (!product || !product.price) return;
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
    if (!shippingForm.firstName || !shippingForm.lastName || !shippingForm.email || !shippingForm.phone || !shippingForm.state || !shippingForm.city || !shippingForm.houseAddress || !shippingForm.address) {
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
    setShowOrderComplete(false);

    // Debug log to check price and quantity types
    console.log('Debug:', { price: product?.price, quantity, typeOfPrice: typeof product?.price, typeOfQuantity: typeof quantity });
    // Prepare the data to send to backend
    const backendData = {
      productId: product?.id ?? '',
      firstName: shippingForm.firstName,
      lastName: shippingForm.lastName,
      email: shippingForm.email,
      phoneNumber: shippingForm.phone,
      state: shippingForm.state,
      city: shippingForm.city,
      houseAddress: shippingForm.houseAddress,
      fullShippingAddress: shippingForm.address,
      referralSlug: referralData && typeof referralData === 'object' && 'refId' in referralData ? referralData.refId : '',
      quantity,
      totalAmount: (Number(String(product?.price).replace(/,/g, '')) || 0) * (Number(quantity) || 0),
      proceed: true
    };
    console.log('Prepared backendData:', backendData);

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
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowShippingModal(false);
      setShippingForm({ firstName: '', lastName: '', email: '', phone: '', state: '', city: '', houseAddress: '', address: '' });
      setShowOrderComplete(true);
      if (!isAuthenticated) setShowCreateAccountPrompt(true);
      // toast.success('🎉 Order successfully paid! Thank you for your purchase.');
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

  useEffect(() => {
    if (showShippingModal && isAuthenticated && typedUser) {
      setShippingForm(prev => ({
        ...prev,
        firstName: typedUser.first_name || '',
        lastName: typedUser.last_name || '',
        email: typedUser.email || '',
        phone: typedUser.phone || '',
      }));
    }
  }, [showShippingModal, isAuthenticated, typedUser]);

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
              {/* Book Images */}
              <div className="order-1 p-4 sm:p-6 lg:p-8">
                <ProductImages
                  images={product.images}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                  productTitle={product.title}
                />
              </div>
              {/* Book Info */}
              <div className="order-2 p-4 sm:p-6 lg:p-8 space-y-4">
                <ProductInfo
                  product={product}
                  selectedFormat={selectedFormat}
                  setSelectedFormat={setSelectedFormat}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  affiliateLink={affiliateLink}
                  isGeneratingLink={isGeneratingLink}
                  linkCopied={linkCopied}
                  handleCopyAffiliateLink={handleCopyAffiliateLink}
                  handleGenerateAffiliateLink={handleGenerateAffiliateLink}
                  isAffiliateReferral={isAffiliateReferral}
                />
                {/* Quantity and Actions */}
                <div className="border-t border-gray-200 pt-4 space-y-4">
                  {/* Quantity selector */}
                  <div className="flex items-center justify-between">
                    <QuantitySelector
                      quantity={quantity}
                      setQuantity={setQuantity}
                      stock={product.stock}
                      toast={toast.error}
                    />
                    <span className="text-sm text-gray-500">
                      {product.stock} units available
                    </span>
                  </div>
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
                {/* Shipping & Policy Info remains here */}
                {/* ... existing shipping & policy info code ... */}
              </div>
            </div>
            {/* Specifications - Full width */}
            <div className="border-t border-gray-200 p-4 sm:p-6 lg:p-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-4">
                Book Details
              </h2>
              <ProductSpecifications specifications={product.specifications || {}} />
            </div>
          </div>
        </div>
      </div>
      {/* Shipping Address Modal */}
      <ShippingModal
        show={showShippingModal}
        onClose={() => setShowShippingModal(false)}
        isProcessingPayment={isProcessingPayment}
        handleShippingSubmit={handleShippingSubmit}
        shippingForm={shippingForm}
        setShippingForm={setShippingForm}
        isAuthenticated={isAuthenticated}
        typedUser={typedUser}
        product={product}
        quantity={quantity}
        setQuantity={setQuantity}
        toast={toast.error}
        stock={product?.stock ?? 0}
      />
      {showOrderComplete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-200">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-green-100 rounded-full p-4 mb-2">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Completed!</h2>
              <p className="text-gray-700 mb-4">Thank you for your purchase. Your order has been placed successfully.</p>
              {isAuthenticated ? (
                <>
                  <button className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition" onClick={() => router.push('/orders')}>Go to My Orders</button>
                  <p className="text-xs text-gray-500 mt-2">You can track your order and get updates in your account dashboard.</p>
                </>
              ) : (
                <>
                  <div className="w-full flex flex-col gap-2 mb-4">
                    <button className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition" onClick={() => router.push(`/auth/login?redirect=${encodeURIComponent(window.location.href)}`)}>Log In to Track Order</button>
                    <button className="w-full py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition" onClick={() => router.push(`/auth/register?redirect=${encodeURIComponent(window.location.href)}`)}>Register for an Account</button>
                    <button className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition" onClick={() => setShowOrderComplete(false)}>Continue as Guest</button>
                  </div>
                  <p className="text-xs text-gray-500">You can track your order and get updates if you log in or register. Otherwise, check your email for order details.</p>
                  {/* Prompt to create account with shipping email */}
                  {showCreateAccountPrompt && shippingForm.email && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-200">
                        {!isCreatingAccount && !showAccountCreated && (
                          <>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Create an account?</h3>
                            <p className="mb-4 text-gray-700">Would you like to create an account with <span className="font-semibold">{shippingForm.email}</span>?</p>
                            <div className="flex flex-col gap-2">
                              <button className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition" onClick={() => {
                                setIsCreatingAccount(true);
                                setTimeout(() => {
                                  setIsCreatingAccount(false);
                                  setShowAccountCreated(true);
                                }, 2000);
                              }}>Yes, Create Account</button>
                              <button className="w-full py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition" onClick={() => setShowCreateAccountPrompt(false)}>No, Thanks</button>
                            </div>
                          </>
                        )}
                        {isCreatingAccount && (
                          <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-base font-semibold text-gray-900">Creating your account...</p>
                          </div>
                        )}
                        {showAccountCreated && (
                          <>
                            <div className="bg-green-100 rounded-full p-3 mb-2 mx-auto w-fit">
                              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Account Created!</h3>
                            <p className="mb-4 text-gray-700">Account successfully created. Please check <span className="font-semibold">{shippingForm.email}</span> for your password. You can now log in to view your orders.</p>
                            <button className="w-full py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition" onClick={() => { setShowAccountCreated(false); setShowCreateAccountPrompt(false); setShowOrderComplete(false); }}>Close</button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              <button className="mt-4 text-sm text-indigo-600 hover:underline" onClick={() => setShowOrderComplete(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}