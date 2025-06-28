"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from '@/services/api';
import { PaymentVerificationLoader } from '@/components/Loader';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800"
};

const statusIcons: Record<OrderStatus, typeof CheckCircle2> = {
  pending: Clock,
  processing: Clock,
  shipped: Clock,
  delivered: CheckCircle2
};

interface OrderData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  orderTotal: string;
  state: string;
  city: string;
  houseAddress: string;
  trackingNumber?: string;
  paymentStatus: string;
  shippingAddress: string;
  orderCreated: string;
  updatedAt: string;
}

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  console.log("order Id: ", orderId)

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      api.paystack.getOrderById(orderId)
        .then((res) => {
          const result = res as unknown as { success: boolean; data?: OrderData; message?: string };
          console.log("Ai single orders page: ", result.data)
          console.log("response status backend: ", result.success)
          if (result.success && result.data) {
            setOrder(result.data);
          } else {
            setError(result.message || 'Order not found');
          }
        })
        .catch((err: { message?: string }) => {
          setError(err?.message || 'Order not found');
        })
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  if (loading) {
    return <PaymentVerificationLoader message="Loading your order details..." />;
  }

  console.log("Order data: ", order)

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-500 mb-4">{error || "The order you're looking for doesn't exist."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order {order.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Placed on {order.orderCreated}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
              <div className="flex items-center gap-4 mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.paymentStatus as OrderStatus] || statusColors.pending}`}>
                  {order.paymentStatus || 'pending'}
                </span>
                {order.trackingNumber && (
                  <span className="text-sm text-gray-500">
                    Tracking: {order.trackingNumber}
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Order Placed</h3>
                      <span className="text-sm text-gray-500">
                        {order.orderCreated}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Order has been placed successfully</p>
                  </div>
                </div>
                {order.paymentStatus === 'pending' && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-yellow-100 text-yellow-600">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Payment Pending</h3>
                        <span className="text-sm text-gray-500">
                          Awaiting payment confirmation
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Your payment is being processed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Customer:</span>
                  <span className="text-gray-700">{order.firstName} {order.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Email:</span>
                  <span className="text-gray-700">{order.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Order Total:</span>
                  <span className="text-gray-700">₦{order.orderTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Payment Status:</span>
                  <span className="text-gray-700">{order.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Order Date:</span>
                  <span className="text-gray-700">{order.orderCreated}</span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900">Tracking Number:</span>
                    <span className="text-gray-700">{order.trackingNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900">Last Updated:</span>
                  <span className="text-gray-700">{order.updatedAt}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">{order.firstName} {order.lastName}</p>
                    <p className="text-gray-500">{order.houseAddress}</p>
                    <p className="text-gray-500">
                      {order.city}, {order.state}
                    </p>
                    <p className="text-gray-500">Nigeria</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Shipping Address</p>
                    <p className="font-medium text-gray-900">{order.shippingAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Payment Method</p>
                    <p className="font-medium text-gray-900">
                      Paystack Payment
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium pt-2">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">₦{order.orderTotal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 