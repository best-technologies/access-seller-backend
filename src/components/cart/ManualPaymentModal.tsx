import { useState, useRef } from "react";
import { X, UploadCloud, Banknote, ChevronDown } from "lucide-react";
import Image from "next/image";

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payNow: number;
}

export default function ManualPaymentModal({ isOpen, onClose, payNow }: ManualPaymentModalProps) {
  const [manualMethod, setManualMethod] = useState("");
  const [showManualUploadBox, setShowManualUploadBox] = useState(false);
  const manualModalRef = useRef<HTMLDivElement>(null);
  const [manualUploads, setManualUploads] = useState<File[]>([]);
  const [manualUploadError, setManualUploadError] = useState<string | null>(null);

  function handleManualUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setManualUploadError(null);
    const files = e.target.files ? Array.from(e.target.files) : [];
    const newFiles = [...manualUploads];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        setManualUploadError('Only JPG, JPEG, and PNG files are allowed.');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setManualUploadError('Each file must be less than 10MB.');
        continue;
      }
      if (newFiles.length >= 3) {
        setManualUploadError('You can upload a maximum of 3 images.');
        break;
      }
      if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push(file);
      }
    }
    setManualUploads(newFiles.slice(0, 3));
  }

  function removeManualUpload(idx: number) {
    setManualUploads(prev => prev.filter((_, i) => i !== idx));
  }

  function resetManualModal() {
    setManualMethod("");
    setShowManualUploadBox(false);
    setManualUploads([]);
    setManualUploadError(null);
  }

  function handleCloseManualModal() {
    onClose();
    resetManualModal();
  }

  function handleSubmitReceipt(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    onClose();
    resetManualModal();
    // You can add a toast or confirmation here if needed
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={manualModalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 relative p-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Banknote className="h-7 w-7 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">Manual Payment</span>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors"
            onClick={handleCloseManualModal}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-2">
          <p className="text-gray-700 mb-5 text-sm text-left">Select your preferred manual payment method below. You will receive instructions after selection.</p>
          {/* Custom Dropdown */}
          <div className="mb-6 relative">
            <label htmlFor="manual-method" className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="relative">
              <select
                id="manual-method"
                className="appearance-none w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 pr-10 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
                value={manualMethod}
                onChange={e => setManualMethod(e.target.value)}
              >
                <option value="">Select a method</option>
                <option value="bank_deposit">Bank Deposit — Pay cash at any branch</option>
                <option value="bank_transfer">Bank Transfer — Send from your mobile app</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Instructions Section */}
          {manualMethod && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 text-left animate-fade-in">
              <div className="font-semibold text-indigo-800 mb-1">Instructions:</div>
              <div className="mb-3 flex items-center gap-2">
                <span className="text-gray-700 text-sm">Amount to pay:</span>
                <span className="text-2xl font-bold text-indigo-700">₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
              </div>
              {manualMethod === 'bank_deposit' && (
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>Visit any branch of our partner bank.</li>
                  <li>Deposit the total amount into the account below.</li>
                  <li>Keep your deposit slip as proof of payment.</li>
                </ul>
              )}
              {manualMethod === 'bank_transfer' && (
                <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                  <li>Open your mobile banking app or internet banking.</li>
                  <li>Transfer the total amount to the account below.</li>
                  <li>Use your order ID as the transfer reference if possible.</li>
                </ul>
              )}
              {/* Example account details (replace with real data) */}
              <div className="mt-3 bg-white border border-indigo-100 rounded p-3 text-xs text-gray-700">
                <div><span className="font-semibold">Bank:</span> Access Bank</div>
                <div><span className="font-semibold">Account Name:</span> Accessible Books Ltd</div>
                <div><span className="font-semibold">Account Number:</span> 1234567890</div>
              </div>
              {/* I have made the transfer button */}
              {!showManualUploadBox && (
                <button
                  className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-base transition-colors shadow"
                  onClick={() => setShowManualUploadBox(true)}
                >
                  I have made the transfer
                </button>
              )}
              {/* Strict notification and upload box only after clicking above */}
              {showManualUploadBox && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                  <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 flex flex-col items-center border border-gray-100">
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors"
                      onClick={() => setShowManualUploadBox(false)}
                      aria-label="Back"
                    >
                      <X className="h-6 w-6" />
                    </button>
                    <UploadCloud className="h-14 w-14 text-indigo-500 mb-3" />
                    <div className="mb-2 text-lg font-bold text-gray-900">Upload Payment Receipt</div>
                    <div className="mb-4 text-sm text-gray-600 text-center max-w-xs">
                      <span className="block mb-2 text-base text-indigo-700 font-semibold">Amount: ₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                      Please upload a clear photo or screenshot of your payment receipt. This is required for us to confirm your order. You can upload up to 3 images (JPG/PNG, max 10MB each).
                    </div>
                    <div className="w-full flex flex-col items-center gap-2">
                      <label htmlFor="manual-upload-input" className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-indigo-100 transition rounded-xl py-8 px-4 mb-2">
                        <UploadCloud className="h-8 w-8 text-indigo-400 mb-2" />
                        <span className="text-sm text-indigo-700 font-medium">Drag & drop or click to select files</span>
                        <span className="text-xs text-gray-500">(JPG, JPEG, PNG, max 10MB each, up to 3 images)</span>
                        <input
                          id="manual-upload-input"
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          multiple
                          onChange={handleManualUpload}
                          className="hidden"
                          disabled={manualUploads.length >= 3}
                        />
                      </label>
                      {manualUploadError && <div className="text-xs text-red-600 mb-1">{manualUploadError}</div>}
                      <div className="flex flex-wrap gap-3 mt-2 w-full justify-center">
                        {manualUploads.map((file, idx) => (
                          <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-indigo-200 bg-white flex items-center justify-center shadow-sm">
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Upload ${idx + 1}`}
                              width={96}
                              height={96}
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-gray-500 hover:text-red-600 shadow"
                              onClick={() => removeManualUpload(idx)}
                              title="Remove"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-6 w-full">
                      <button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-base transition-colors shadow"
                        onClick={handleSubmitReceipt}
                        disabled={manualUploads.length === 0}
                      >
                        Submit Receipt
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {!showManualUploadBox && (
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-base transition-colors mt-2 shadow"
              onClick={handleCloseManualModal}
              disabled={!manualMethod}
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 