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
  Check
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import GeneralNavbar from "@/components/GeneralNavbar";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import toast from "react-hot-toast";
import { api } from '@/services/api';
import Loader from "@/components/Loader";

export default function ProductDetailPage() {
  const params = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract product ID from slug
  const slug = params?.slug as string;
  const productId = slug && slug.includes('-') ? slug.substring(0, slug.indexOf('-')) : slug || null;
  console.log('slug:', slug, 'productId:', productId);

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
        price: product.price,
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h1>
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
                  </div>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ${product.price}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ${product.originalPrice}
                      </span>
                      <span className="text-green-600 font-medium">
                        Save ${(product.originalPrice - product.price).toFixed(2)}
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
                        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => addToCart({
                          productId: String(product.id),
                          quantity,
                          price: product.price,
                          product: {
                            name: product.title,
                            image: product.images[0],
                            category: product.category
                          }
                        })}>
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Add to Cart
                        </Button>
                        <Button 
                          variant="outline" 
                          className={`flex-1 ${isInWishlist(String(product.id)) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}`}
                          onClick={handleWishlistToggle}
                        >
                          <Heart className={`h-5 w-5 mr-2 ${isInWishlist(String(product.id)) ? 'fill-current' : ''}`} />
                          {isInWishlist(String(product.id)) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        </Button>
                      </>
                    )}
                  </div>
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
    </>
  );
} 