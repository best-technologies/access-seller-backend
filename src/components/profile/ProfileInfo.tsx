import { Mail, Phone, MapPin, BookOpen, Heart } from "lucide-react";

interface ProfileInfoProps {
  userData: {
    email: string;
    phone: string;
    address: string;
    stats: {
      orders: number;
      wishlist: number;
      reviews: number;
    };
  };
}

export default function ProfileInfo({ userData }: ProfileInfoProps) {
  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-gray-900">{userData.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-gray-900">{userData.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-gray-900">{userData.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">{userData.stats.orders}</p>
              <p className="text-sm text-gray-500">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">{userData.stats.wishlist}</p>
              <p className="text-sm text-gray-500">Wishlist Items</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-2xl font-semibold text-gray-900">{userData.stats.reviews}</p>
              <p className="text-sm text-gray-500">Book Reviews</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 