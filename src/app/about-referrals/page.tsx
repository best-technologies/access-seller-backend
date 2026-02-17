import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AboutReferralsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About Our Referral Program
          </h1>
          <p className="text-xl text-gray-600">
            Join our referral program and earn rewards for every friend you refer. It&apos;s simple, rewarding, and helps others discover great books.
          </p>
        </div>

        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 mb-4">
              Our referral program is designed to reward both you and your friends for spreading the word about our amazing products. Here&apos;s how it works:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Share your unique referral link with friends and family</li>
              <li>When they make their first purchase, they get a special discount</li>
              <li>You earn rewards for each successful referral</li>
              <li>Redeem your rewards for future purchases</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  For You
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li>Earn rewards on every referral</li>
                  <li>Exclusive member benefits</li>
                  <li>Early access to new products</li>
                  <li>Special referral-only discounts</li>
                </ul>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  For Your Friends
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li>Welcome discount on first purchase</li>
                  <li>Access to member-exclusive deals</li>
                  <li>Quality products at great prices</li>
                  <li>Excellent customer service</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Getting Started
            </h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <ol className="list-decimal pl-6 text-gray-600 space-y-4">
                <li>
                  <strong className="text-gray-900">Create an Account</strong>
                  <p>Sign up for an account to get your unique referral link</p>
                </li>
                <li>
                  <strong className="text-gray-900">Share Your Link</strong>
                  <p>Share your referral link with friends through social media, email, or messaging</p>
                </li>
                <li>
                  <strong className="text-gray-900">Track Your Rewards</strong>
                  <p>Monitor your referral activity and rewards in your account dashboard</p>
                </li>
                <li>
                  <strong className="text-gray-900">Redeem Rewards</strong>
                  <p>Use your earned rewards for future purchases</p>
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Terms & Conditions
            </h2>
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-4">
                Please note that our referral program is subject to the following terms:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Referrals must be new customers</li>
                <li>Rewards are subject to verification</li>
                <li>Program terms may be updated periodically</li>
                <li>Rewards expire after 12 months</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 