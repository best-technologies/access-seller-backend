import { Activity, User, DollarSign, Calendar } from "lucide-react";
import type { AffiliateEvent } from '@/types/admin/dashboard/dashboard';

interface EventsTabProps {
  events: AffiliateEvent[];
}

export default function EventsTab({ events }: EventsTabProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "Purchase":
        return "bg-green-100 text-green-800";
      case "Signup":
        return "bg-blue-100 text-blue-800";
      case "Click":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "Purchase":
        return <DollarSign className="h-4 w-4" />;
      case "Signup":
        return <User className="h-4 w-4" />;
      case "Click":
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Affiliate Events Timeline</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affiliate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => (
                <tr key={event.eventId} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4">{new Date(event.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4">{event.affiliateName}</td>
                  <td className="px-6 py-4">{event.type}</td>
                  <td className="px-6 py-4">{event.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 