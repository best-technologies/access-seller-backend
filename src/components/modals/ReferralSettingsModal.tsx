"use client";

import { useState } from "react";
import { X, Save, Percent, Users, Award, Clock } from "lucide-react";

interface AffiliateSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AffiliateSettings) => void;
  initialSettings: AffiliateSettings;
}

export interface AffiliateSettings {
  affiliatePercentage: number;
  minimumAffiliates: number;
  rewardThreshold: number;
  expirationDays: number;
}

export default function AffiliateSettingsModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: AffiliateSettingsModalProps) {
  const [settings, setSettings] = useState<AffiliateSettings>(initialSettings);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Edit Affiliate Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Affiliate Percentage */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Percent className="h-4 w-4" />
                Affiliate Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.affiliatePercentage}
                  onChange={(e) => setSettings({
                    ...settings,
                    affiliatePercentage: parseFloat(e.target.value)
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter percentage"
                  aria-label="Affiliate percentage"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <p className="text-sm text-gray-500">Percentage of sale amount given as affiliate reward</p>
            </div>

            {/* Minimum Affiliates */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-4 w-4" />
                Minimum Affiliates
              </label>
              <input
                type="number"
                min="0"
                value={settings.minimumAffiliates}
                onChange={(e) => setSettings({
                  ...settings,
                  minimumAffiliates: parseInt(e.target.value)
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter minimum affiliates"
                aria-label="Minimum affiliates"
              />
              <p className="text-sm text-gray-500">Minimum number of affiliates required for rewards</p>
            </div>

            {/* Reward Threshold */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Award className="h-4 w-4" />
                Reward Threshold
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  value={settings.rewardThreshold}
                  onChange={(e) => setSettings({
                    ...settings,
                    rewardThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter threshold amount"
                  aria-label="Reward threshold"
                />
              </div>
              <p className="text-sm text-gray-500">Minimum purchase amount required for affiliate reward</p>
            </div>

            {/* Expiration Days */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4" />
                Expiration Days
              </label>
              <input
                type="number"
                min="1"
                value={settings.expirationDays}
                onChange={(e) => setSettings({
                  ...settings,
                  expirationDays: parseInt(e.target.value)
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter number of days"
                aria-label="Expiration days"
              />
              <p className="text-sm text-gray-500">Number of days before affiliate link expires</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 