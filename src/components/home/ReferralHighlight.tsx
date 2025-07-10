import { Button } from "@/components/ui/button";
import { Gift, Share2, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ReferralHighlight() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <div className="relative py-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl" />
      <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-opacity-5 rounded-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Earn While You Share</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Turn your love for books into a rewarding experience. Share with friends and earn commissions on every purchase.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Column - Features */}
          <div className="space-y-10">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <Share2 className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Share Your Unique Link</h3>
                <p className="text-gray-600 text-lg">Get a personalized referral link to share with your network.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-7 h-7 text-indigo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    fontSize="18"
                    fontWeight="bold"
                    fill="currentColor"
                    dy=".3em"
                  >₦</text>
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Earn Up to 25% Commission</h3>
                <p className="text-gray-600 text-lg">Get paid for every successful purchase made through your link.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Track Your Earnings</h3>
                <p className="text-gray-600 text-lg">Monitor your performance and earnings in real-time.</p>
              </div>
            </div>

            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-6 text-lg"
              onClick={() => {
                if (!user) {
                  router.push("/auth/register");
                } else {
                  router.push("/profile?tab=referrals");
                }
              }}
            >
              Start Earning Now
            </Button>
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-xl p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-2xl">Your Referral Dashboard</h3>
                  <p className="text-gray-500 text-lg">Track your success</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Total Earnings</p>
                    <p className="text-3xl font-bold text-indigo-600">#1,234.56</p>
                  </div>
                  <div className="text-green-500 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">+15% this month</div>
                </div>

                <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Successful Referrals</p>
                    <p className="text-3xl font-bold text-indigo-600">48</p>
                  </div>
                  <div className="text-green-500 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">+12 this month</div>
                </div>

                <div className="flex justify-between items-center p-6 bg-gray-50 rounded-2xl">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
                    <p className="text-3xl font-bold text-indigo-600">32%</p>
                  </div>
                  <div className="text-green-500 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">+5% this month</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
