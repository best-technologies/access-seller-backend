import { Cpu, HardDrive, Wifi, Database } from "lucide-react";
import { systemMetrics } from "@/data/admin/dashboard/mockData";

export default function SystemMetrics() {
  const getMetricColor = (value: number) => {
    if (value >= 80) return "text-red-600";
    if (value >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  const getMetricBgColor = (value: number) => {
    if (value >= 80) return "bg-red-100";
    if (value >= 60) return "bg-yellow-100";
    return "bg-green-100";
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "cpu":
        return <Cpu className="h-5 w-5" />;
      case "memory":
        return <Database className="h-5 w-5" />;
      case "storage":
        return <HardDrive className="h-5 w-5" />;
      case "network":
        return <Wifi className="h-5 w-5" />;
      default:
        return <Cpu className="h-5 w-5" />;
    }
  };

  const metrics = [
    { key: "cpu", label: "CPU Usage", value: systemMetrics.cpu, icon: "cpu" },
    { key: "memory", label: "Memory Usage", value: systemMetrics.memory, icon: "memory" },
    { key: "storage", label: "Storage Usage", value: systemMetrics.storage, icon: "storage" },
    { key: "network", label: "Network", value: systemMetrics.network, icon: "network" }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">System Metrics</h3>
          <p className="text-sm text-gray-500">Server performance indicators</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-600 font-medium">Online</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 ${getMetricBgColor(metric.value)} rounded-lg`}>
                <div className={getMetricColor(metric.value)}>
                  {getMetricIcon(metric.icon)}
                </div>
              </div>
              <span className={`text-lg font-bold ${getMetricColor(metric.value)}`}>
                {metric.value}%
              </span>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">{metric.label}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metric.value >= 80 ? 'bg-red-500' :
                    metric.value >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Last updated</span>
          <span className="text-gray-900 font-medium">2 minutes ago</span>
        </div>
      </div>
    </div>
  );
} 