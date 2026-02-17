"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Home,
} from "lucide-react";

// Mock data - Replace with actual order data
const orderDetails = {
  orderNumber: "ORD-2024-001",
  estimatedDelivery: "March 15, 2024",
  items: [
    {
      id: 1,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      price: 19.99,
      image: "/books/great-gatsby.jpg",
      quantity: 1,
    },
    {
      id: 2,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      price: 15.99,
      image: "/books/mockingbird.jpg",
      quantity: 2,
    },
  ],
  shippingAddress: {
    name: "John Doe",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
  },
  total: 51.97,
};

export default function OrderSuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Thank you for your purchase. Your order has been received.
          </p>
        </div>

        <div className="space-y-8">
          {/* Order Details */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">
                    Order Details
                  </h2>
                  <p className="text-sm text-gray-500">
                    Order #{orderDetails.orderNumber}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
              </div>

              <div className="space-y-6">
                {/* Items */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Items
                  </h3>
                  <div className="space-y-4">
                    {orderDetails.items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={64}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {item.author}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantity: {item.quantity}
                          </p>
                          <p className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Shipping Address
                  </h3>
                  <p className="text-gray-600">
                    {orderDetails.shippingAddress.name}
                    <br />
                    {orderDetails.shippingAddress.address}
                    <br />
                    {orderDetails.shippingAddress.city},{" "}
                    {orderDetails.shippingAddress.state}{" "}
                    {orderDetails.shippingAddress.zipCode}
                  </p>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">
                      ${orderDetails.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">
                What&apos;s Next?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Order Processing
                    </h3>
                    <p className="text-gray-600 mt-1">
                      We&apos;re preparing your order for shipment. You&apos;ll receive an
                      email when your order ships.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Truck className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Estimated Delivery
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Your order should arrive by {orderDetails.estimatedDelivery}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => router.push("/products")}
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
            >
              Return Home
              <Home className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 