interface CartPromoCodeProps {
  promoCode: string;
  promoApplied: boolean;
  isLoading: boolean;
  onChange: (v: string) => void;
  onApply: () => void;
  discountPercent: number;
}

export default function CartPromoCode({ promoCode, promoApplied, isLoading, onChange, onApply, discountPercent }: CartPromoCodeProps) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="referral-code" className="text-sm font-medium text-gray-700">Referral Code</label>
      <div className="flex gap-2">
        <input
          id="referral-code"
          type="text"
          value={promoCode}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base placeholder:text-gray-400 text-gray-900 bg-gray-50"
          placeholder="Enter referral code"
          disabled={promoApplied || isLoading}
        />
        <button
          type="button"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onApply}
          disabled={promoCode.trim() === "" || promoApplied || isLoading}
        >
          {promoApplied ? "Applied" : "Apply"}
        </button>
      </div>
      {promoApplied && discountPercent > 0 && (
        <span className="text-green-600 text-xs mt-1">Referral code applied! {discountPercent}% discount.</span>
      )}
    </div>
  );
} 