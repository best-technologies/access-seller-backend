import type { AffiliateEvent } from '@/types/admin/dashboard/dashboard';

interface EventsTabProps {
  events: AffiliateEvent[];
}

export default function EventsTab({ events }: EventsTabProps) {
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