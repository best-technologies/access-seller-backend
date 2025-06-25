"use client";

import { Bell, CheckCircle, Info, AlertTriangle } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "info",
    title: "System Update",
    message: "The system will undergo maintenance on Saturday at 2:00 AM.",
    date: "2024-06-10 09:00",
    read: false,
  },
  {
    id: 2,
    type: "success",
    title: "Payment Processed",
    message: "A payment of ₦50,000 was successfully processed.",
    date: "2024-06-09 15:30",
    read: false,
  },
  {
    id: 3,
    type: "warning",
    title: "Low Stock Alert",
    message: "Product 'JavaScript Mastery' is low on stock.",
    date: "2024-06-08 12:10",
    read: true,
  },
];

function getIcon(type: string) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case "warning":
      return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    case "info":
    default:
      return <Info className="h-6 w-6 text-blue-500" />;
  }
}

export default function NotificationsPage() {
  // In a real app, notifications would come from state or API
  const hasNotifications = notifications.length > 0;

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="h-8 w-8 text-indigo-600" />
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>
      <div className="flex justify-end mb-4">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          Mark all as read
        </button>
      </div>
      {hasNotifications ? (
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm transition-colors ${n.read ? "bg-gray-50 border-gray-200" : "bg-white border-indigo-200"}`}
            >
              <div className="mt-1">{getIcon(n.type)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-gray-900 text-lg">{n.title}</h2>
                  {!n.read && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700">New</span>}
                </div>
                <p className="text-gray-700 mt-1 mb-2 text-sm">{n.message}</p>
                <div className="text-xs text-gray-400">{n.date}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <Bell className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">No notifications yet</p>
          <p className="text-sm">You're all caught up!</p>
        </div>
      )}
    </div>
  );
} 