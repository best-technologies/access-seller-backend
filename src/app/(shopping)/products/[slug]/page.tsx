"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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
import PageHeader from "@/components/ui/PageHeader";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import toast from "react-hot-toast";

// Mock data - In a real app, this would come from an API
const products = [
  {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    price: 24.99,
    originalPrice: 29.99,
    rating: 4.5,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
    category: "Fiction",
    isNew: true,
    discount: 17,
    shipping: "Free Shipping",
    delivery: "2-3 days",
    format: "Hardcover",
    pages: 240,
    language: "English",
    isbn: "978-0743273565",
    publishedDate: "April 10, 1925",
    description: "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, the novel depicts narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan.",
    stock: 15,
    availableFormats: ["Hardcover", "Paperback", "E-Book", "Audiobook"],
    images: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop",
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&h=500&fit=crop"
    ],
    features: [
      "Classic American Literature",
      "Beautiful Hardcover Edition",
      "Includes Critical Analysis",
      "Perfect for Book Collectors",
      "Great Gift Choice"
    ],
    specifications: {
      "Publisher": "Scribner",
      "Publication Date": "April 10, 1925",
      "Pages": "240",
      "Language": "English",
      "ISBN-10": "0743273567",
      "ISBN-13": "978-0743273565",
      "Dimensions": "5.5 x 0.6 x 8.4 inches",
      "Weight": "12.8 ounces"
    }
  }
];

export default function ProductDetailPage() {
  const params = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState("Hardcover");

  // Extract product ID from slug with type safety
  const slug = params?.slug as string;
  const productId = slug ? parseInt(slug.split('-')[0]) : null;
  const product = productId ? products.find(p => p.id === productId) : null;

  const { cart, addToCart, updateQuantity, removeFromCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const cartItem = cart.find(item => item.productId === String(product?.id));

  const handleWishlistToggle = () => {
    if (!product) return;
    
    const productId = String(product.id);
    
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      toast.success(`${product.title} removed from wishlist`);
    } else {
      addToWishlist({
        id: productId,
        title: product.title,
        author: product.author,
        price: product.price,
        image: product.images[0],
        category: product.category,
        rating: product.rating,
        reviews: product.reviews,
        originalPrice: product.originalPrice,
        discount: product.discount,
        isNew: product.isNew
      });
      toast.success(`${product.title} added to wishlist`);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h1>
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
      <PageHeader title="Book Details" />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link 
              href="/products"
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Books
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
                  {product.images.map((image, index) => (
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
                    {product.availableFormats.map((format) => (
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
                    {product.features.map((feature, index) => (
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
                      <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => updateQuantity(String(product.id), quantity)}>
                        <Check className="h-5 w-5 mr-2" />
                        Update Cart
                      </Button>
                    ) : (
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
                    )}
                    {cartItem && (
                      <Button variant="outline" className="flex-1" onClick={() => removeFromCart(String(product.id))}>
                        Remove
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      className={`flex-1 ${isInWishlist(String(product.id)) ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : ''}`}
                      onClick={handleWishlistToggle}
                    >
                      <Heart className={`h-5 w-5 mr-2 ${isInWishlist(String(product.id)) ? 'fill-current' : ''}`} />
                      {isInWishlist(String(product.id)) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    </Button>
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
                    <span className="w-2/3 text-gray-900">{value}</span>
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