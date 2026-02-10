import React, { useState, useRef } from "react";
import { X, UploadCloud, Banknote } from "lucide-react";
import Image from "next/image";
import Confetti from "react-confetti";
import { api } from '@/services/api';

interface ManualPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payNow: number;
  getOrderData: () => Record<string, unknown>;
  onSubmitStart: () => void;
  onSuccess: () => void;
  clearCart: () => void;
}

export default function ManualPaymentModal({ isOpen, onClose, payNow, getOrderData, onSubmitStart, onSuccess, clearCart }: ManualPaymentModalProps) {
  const [showManualUploadBox, setShowManualUploadBox] = useState(false);
  const manualModalRef = useRef<HTMLDivElement>(null);
  const [manualUploads, setManualUploads] = useState<File[]>([]);
  const [manualUploadError, setManualUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // Removed unused showLoadingModal state

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
    setShowManualUploadBox(false);
    setManualUploads([]);
    setManualUploadError(null);
    setIsSubmitting(false);
    setShowConfetti(false);
  }

  function handleCloseManualModal() {
    onClose();
    resetManualModal();
  }

  async function handleSubmitReceipt(e?: React.MouseEvent) {
    if (e) e.preventDefault();
    onSubmitStart();
    setIsSubmitting(true);
    setShowManualUploadBox(false); // Close upload modal
    onClose(); // Close the main modal
    const orderData = getOrderData();
    // console.log('Bank Deposit Submission (to backend):', { ...orderData, files: manualUploads });
    try {
      const response = await api.paystack.manualBankDeposit(orderData, manualUploads);
      const res = response?.data ? response.data : response;
      console.log('Bank Deposit Backend Response:', res);
      if (res.success) {
        setShowConfetti(true);
        clearCart();
        onSuccess();
        setManualUploadError(null);
      } else if (res && res.message) {
        setManualUploadError(res.message);
      }
    } catch (err) {
      console.error('Bank Deposit Error:', err);
      setManualUploadError('Failed to submit bank deposit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Loader is now handled by the parent, so remove this block

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={400} recycle={false} />} 
      <div
        ref={manualModalRef}
        className={
          `bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 relative p-0 ${isSubmitting ? 'pointer-events-none opacity-60' : ''}`
        }
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <Banknote className="h-7 w-7 text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">Bank Deposit</span>
          </div>
          <button
            className="text-gray-400 hover:text-gray-600 rounded-full p-1.5 transition-colors"
            onClick={handleCloseManualModal}
            aria-label="Close"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="px-6 pb-6 pt-2">
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-4 text-left animate-fade-in">
            <div className="font-semibold text-indigo-800 mb-1">Instructions:</div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-gray-700 text-sm">Amount to pay:</span>
              <span className="text-2xl font-bold text-indigo-700">₦{payNow.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Visit any branch of our partner bank or use your mobile banking app.</li>
              <li>Deposit or transfer the total amount into the account below.</li>
              <li>Keep your deposit slip or transfer receipt as proof of payment.</li>
            </ul>
            {/* Example account details (replace with real data) */}
            <div className="mt-3 bg-white border border-indigo-100 rounded p-3 text-xs text-gray-700 space-y-2">
              <div>
                <span className="font-semibold">Bank:</span> FIDELITY BANK<br/>
                <span className="font-semibold">Account Name:</span> Accessible Publishers Ltd<br/>
                <span className="font-semibold">Account Number:</span> 4010091422
              </div>
              <div className="border-t border-indigo-100 pt-2">
                <span className="font-semibold">Bank:</span> UNION BANK<br/>
                <span className="font-semibold">Account Name:</span> Accessible Publishers Ltd<br/>
                <span className="font-semibold">Account Number:</span> 0192083189
              </div>
            </div>
            {/* I have made the transfer button */}
            {!showManualUploadBox && (
              <button
                className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold text-base transition-colors shadow"
                onClick={() => setShowManualUploadBox(true)}
                disabled={isSubmitting}
              >
                I have made the payment
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
                    disabled={isSubmitting}
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
                        disabled={manualUploads.length >= 3 || isSubmitting}
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
                            disabled={isSubmitting}
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
                      disabled={manualUploads.length === 0 || isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-indigo-400" />
                          Submitting
                        </span>
                      ) : 'Submit Receipt'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {!showManualUploadBox && (
            <button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold text-base transition-colors mt-2 shadow"
              onClick={handleCloseManualModal}
              disabled={isSubmitting}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 