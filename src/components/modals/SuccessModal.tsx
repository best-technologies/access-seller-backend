import { Check } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  message = 'Books have been successfully added!'
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
} 