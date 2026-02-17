"use client";

import { useState } from "react";

// Mock promo codes for demo
const mockPromoCodes = [
  { id: 1, code: "SUMMER24", discount: 10, status: "active", created: "2024-06-15" },
  { id: 2, code: "BOOKLOVER", discount: 15, status: "inactive", created: "2024-05-20" },
  { id: 3, code: "NAIRASALE", discount: 20, status: "active", created: "2024-06-10" },
];

export default function PromosCommissionsPage() {
  // Tab State
  const [activeTab, setActiveTab] = useState<'promos' | 'commissions'>('promos');

  // Promo Code State
  const [promoType, setPromoType] = useState<'global' | 'selected'>('global');
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("");

  // Commission State
  const [commissionType, setCommissionType] = useState<'general' | 'selected'>('general');
  const [commissionPercent, setCommissionPercent] = useState("");

  const [promoCodes, setPromoCodes] = useState(mockPromoCodes);

  const handleToggleStatus = (id: number) => {
    setPromoCodes((prev) =>
      prev.map((promo) =>
        promo.id === id
          ? { ...promo, status: promo.status === "active" ? "inactive" : "active" }
          : promo
      )
    );
  };

  const handleDeletePromo = (id: number) => {
    setPromoCodes((prev) => prev.filter((promo) => promo.id !== id));
  };

  const handleCreatePromo = () => {
    if (promoCode && promoDiscount) {
      const newPromo = {
        id: promoCodes.length + 1,
        code: promoCode.toUpperCase(),
        discount: parseInt(promoDiscount),
        status: "active" as const,
        created: new Date().toISOString().split('T')[0]
      };
      setPromoCodes([...promoCodes, newPromo]);
      setPromoCode("");
      setPromoDiscount("");
    }
  };

  const tabs = [
    {
      id: 'promos',
      name: 'Promo Codes',
      icon: '🎫',
      count: promoCodes.length
    },
    {
      id: 'commissions',
      name: 'Referral Commissions',
      icon: '💰',
      count: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Promos & Commissions</h1>
          <p className="mt-2 text-gray-600">Manage promotional codes and referral commission settings</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200 bg-white rounded-t-2xl shadow-sm">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'promos' | 'commissions')}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg mr-2">{tab.icon}</span>
                  {tab.name}
                  {tab.count !== null && (
                    <span className={`ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl rounded-t-none shadow-sm border border-gray-200 border-t-0 min-h-96">
          {activeTab === 'promos' && (
            <div className="p-6">
              {/* Promo Codes Content */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Promo Code Creation Form */}
                <div className="xl:col-span-1">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-blue-200 bg-white bg-opacity-70">
                      <h2 className="text-lg font-semibold text-gray-900">Create Promo Code</h2>
                      <p className="text-sm text-gray-600 mt-1">Add a new promotional discount</p>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Promo Code
                          </label>
                          <input
                            type="text"
                            value={promoCode}
                            onChange={e => setPromoCode(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                            placeholder="e.g. SUMMER24"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Percentage
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={promoDiscount}
                              onChange={e => setPromoDiscount(e.target.value)}
                              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                              placeholder="10"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                              <span className="text-gray-500 text-sm">%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Application Scope
                          </label>
                          <div className="space-y-3">
                            <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-white hover:bg-opacity-70 cursor-pointer transition-colors duration-200 bg-white bg-opacity-50">
                              <input
                                type="radio"
                                name="promoType"
                                value="global"
                                checked={promoType === 'global'}
                                onChange={() => setPromoType('global')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <span className="text-sm font-medium text-gray-900">All Products</span>
                                <p className="text-xs text-gray-600">Apply to entire catalog</p>
                              </div>
                            </label>
                            <label className="flex items-center p-3 border border-gray-200 rounded-xl hover:bg-white hover:bg-opacity-70 cursor-pointer transition-colors duration-200 bg-white bg-opacity-50">
                              <input
                                type="radio"
                                name="promoType"
                                value="selected"
                                checked={promoType === 'selected'}
                                onChange={() => setPromoType('selected')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3">
                                <span className="text-sm font-medium text-gray-900">Selected Products</span>
                                <p className="text-xs text-gray-600">Choose specific items</p>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {promoType === 'selected' && (
                          <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Select Products
                            </label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                              placeholder="Product selector coming soon..."
                              disabled
                            />
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleCreatePromo}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 transform active:scale-95"
                      >
                        Create Promo Code
                      </button>
                    </div>
                  </div>
                </div>

                {/* Promo Codes List */}
                <div className="xl:col-span-2">
                  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">Active Promo Codes</h2>
                          <p className="text-sm text-gray-500 mt-1">{promoCodes.length} total codes</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {promoCodes.filter(p => p.status === 'active').length} Active
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {promoCodes.filter(p => p.status === 'inactive').length} Inactive
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {promoCodes.map((promo) => (
                            <tr key={promo.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4">
                                <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded-md text-sm">
                                  {promo.code}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-lg font-semibold text-gray-900">{promo.discount}%</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                  promo.status === "active" 
                                    ? "bg-green-100 text-green-700 border border-green-200" 
                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                    promo.status === "active" ? "bg-green-500" : "bg-gray-400"
                                  }`} />
                                  {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(promo.created).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleToggleStatus(promo.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                      promo.status === "active"
                                        ? "bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200"
                                        : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                    }`}
                                  >
                                    {promo.status === "active" ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => handleDeletePromo(promo.id)}
                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium border border-red-200 transition-all duration-200"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div className="p-8">
              {/* Referral Commission Content */}
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl mb-4">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Referral Commission Settings</h2>
                  <p className="text-gray-600">Configure commission rates and application rules for your referral program</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-green-200 bg-white bg-opacity-70">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Commission Configuration</h3>
                        <p className="text-sm text-gray-600 mt-1">Set up how referrers earn from successful referrals</p>
                      </div>
                      <div className="bg-green-100 border border-green-200 rounded-xl px-4 py-2">
                        <div className="text-sm text-green-700 font-medium">Current Rate</div>
                        <div className="text-2xl font-bold text-green-900">7.5%</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            New Commission Rate
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={commissionPercent}
                              onChange={e => setCommissionPercent(e.target.value)}
                              className="w-full px-6 py-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white text-lg"
                              placeholder="5.0"
                              required
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                              <span className="text-gray-500 text-lg font-medium">%</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">Enter the percentage of each sale that referrers will earn</p>
                        </div>
                        
                        <div className="bg-white bg-opacity-60 rounded-xl p-6 border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Commission Calculator</h4>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sale Amount:</span>
                              <span className="font-medium">₦10,000</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Commission Rate:</span>
                              <span className="font-medium">{commissionPercent || '7.5'}%</span>
                            </div>
                            <div className="border-t border-green-200 pt-2 flex justify-between">
                              <span className="text-gray-900 font-semibold">Referrer Earns:</span>
                              <span className="font-bold text-green-700">
                                ₦{((parseFloat(commissionPercent) || 7.5) * 100).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Commission Application Scope
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <label className="flex items-start p-6 border border-gray-200 rounded-xl hover:bg-white hover:bg-opacity-70 cursor-pointer transition-colors duration-200 bg-white bg-opacity-50">
                            <input
                              type="radio"
                              name="commissionType"
                              value="general"
                              checked={commissionType === 'general'}
                              onChange={() => setCommissionType('general')}
                              className="text-green-600 focus:ring-green-500 mt-1"
                            />
                            <div className="ml-4">
                              <span className="text-base font-medium text-gray-900 block">All Products</span>
                              <p className="text-sm text-gray-600 mt-1">Apply commission rate to all products in your catalog universally</p>
                              <div className="flex items-center mt-3 text-xs text-green-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Recommended for simplicity
                              </div>
                            </div>
                          </label>
                          <label className="flex items-start p-6 border border-gray-200 rounded-xl hover:bg-white hover:bg-opacity-70 cursor-pointer transition-colors duration-200 bg-white bg-opacity-50">
                            <input
                              type="radio"
                              name="commissionType"
                              value="selected"
                              checked={commissionType === 'selected'}
                              onChange={() => setCommissionType('selected')}
                              className="text-green-600 focus:ring-green-500 mt-1"
                            />
                            <div className="ml-4">
                              <span className="text-base font-medium text-gray-900 block">Selected Products</span>
                              <p className="text-sm text-gray-600 mt-1">Set different commission rates for specific products or categories</p>
                              <div className="flex items-center mt-3 text-xs text-blue-600">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                                Advanced configuration
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>
                      
                      {commissionType === 'selected' && (
                        <div className="animate-in slide-in-from-top-2 duration-200 bg-white bg-opacity-60 rounded-xl p-6 border border-green-200">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Product-Specific Commission Settings
                          </label>
                          <div className="space-y-4">
                            <input
                              type="text"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500"
                              placeholder="Advanced product selector with individual rate settings coming soon..."
                              disabled
                            />
                            <p className="text-xs text-gray-500">
                              This will allow you to set different commission rates for individual products or product categories.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between pt-6 border-t border-green-200">
                        <div className="flex items-center space-x-4">
                          <button
                            type="button"
                            className="px-8 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all duration-200 transform active:scale-95"
                          >
                            Update Commission Settings
                          </button>
                          <button
                            type="button"
                            className="px-6 py-3 bg-white bg-opacity-70 text-gray-700 font-medium rounded-xl hover:bg-white hover:bg-opacity-90 border border-gray-300 transition-all duration-200"
                          >
                            Reset to Default
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Changes will apply to new referrals</p>
                          <p className="text-xs text-gray-500">Existing pending commissions remain unchanged</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}