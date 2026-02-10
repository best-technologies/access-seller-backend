import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

interface AddLanguageModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLanguageModal({ open, onClose, onSuccess }: AddLanguageModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.addLanguage(name);
      if (res.success) {
        setName("");
        onSuccess();
      } else {
        setError(res.message || "Failed to add language");
      }
    } catch {
      setError("Failed to add language");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="mb-4">
          <h2 className="text-lg font-bold">Add New Language</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Language name"
              required
            />
          </div>
          {error && <div className="text-sm text-red-500 text-center">{error}</div>}
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white" disabled={loading}>
              {loading ? "Adding..." : "Proceed"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 