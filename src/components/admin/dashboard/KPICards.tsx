import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  TrendingDown
} from "lucide-react";
// import { dashboardKPIs } from "@/data/admin/dashboard/mockData";

interface KPI {
  title: string;
  value: number;
  change: number;
  changeType: "increase" | "decrease";
  icon: string;
  color: string;
  format: string;
}

export default function KPICards({ kpis }: { kpis: KPI[] }) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "DollarSign":
        return <DollarSign className="h-6 w-6" />;
      case "ShoppingCart":
        return <ShoppingCart className="h-6 w-6" />;
      case "Users":
        return <Users className="h-6 w-6" />;
      case "TrendingUp":
        return <TrendingUp className="h-6 w-6" />;
      case "BarChart3":
        return <BarChart3 className="h-6 w-6" />;
      case "RefreshCw":
        return <RefreshCw className="h-6 w-6" />;
      default:
        return <BarChart3 className="h-6 w-6" />;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "purple":
        return {
          bg: "bg-gradient-to-br from-purple-50 to-violet-50",
          border: "border-purple-100",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
          textColor: "text-purple-600",
          changeColor: "text-purple-600"
        };
      case "blue":
        return {
          bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
          border: "border-blue-100",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          textColor: "text-blue-600",
          changeColor: "text-blue-600"
        };
      case "green":
        return {
          bg: "bg-gradient-to-br from-green-50 to-emerald-50",
          border: "border-green-100",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          textColor: "text-green-600",
          changeColor: "text-green-600"
        };
      case "orange":
        return {
          bg: "bg-gradient-to-br from-orange-50 to-amber-50",
          border: "border-orange-100",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          textColor: "text-orange-600",
          changeColor: "text-orange-600"
        };
      case "indigo":
        return {
          bg: "bg-gradient-to-br from-indigo-50 to-blue-50",
          border: "border-indigo-100",
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
          textColor: "text-indigo-600",
          changeColor: "text-indigo-600"
        };
      case "red":
        return {
          bg: "bg-gradient-to-br from-red-50 to-rose-50",
          border: "border-red-100",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          textColor: "text-red-600",
          changeColor: "text-red-600"
        };
      default:
        return {
          bg: "bg-gradient-to-br from-gray-50 to-slate-50",
          border: "border-gray-100",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-600",
          textColor: "text-gray-600",
          changeColor: "text-gray-600"
        };
    }
  };

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "currency":
        return `₦${value.toLocaleString()}`;
      case "percentage":
        return `${value}%`;
      default:
        return value.toLocaleString();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {kpis.map((kpi, index) => {
        const colors = getColorClasses(kpi.color);
        
        return (
          <div
            key={index}
            className={`${colors.bg} rounded-xl shadow-sm border ${colors.border} p-6 hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`text-sm font-medium ${colors.textColor}`}>
                  {kpi.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatValue(kpi.value, kpi.format)}
                </p>
              </div>
              <div className={`p-3 ${colors.iconBg} rounded-lg`}>
                <div className={colors.iconColor}>
                  {getIcon(kpi.icon)}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              {kpi.changeType === "increase" ? (
                <TrendingUp className={`h-4 w-4 ${colors.changeColor}`} />
              ) : (
                <TrendingDown className={`h-4 w-4 ${colors.changeColor}`} />
              )}
              <span className={`text-sm font-medium ${colors.changeColor}`}>
                {kpi.changeType === "increase" ? "+" : ""}{kpi.change}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last month</span>
            </div>
          </div>
        );
      })}
    </div>
  );
} 