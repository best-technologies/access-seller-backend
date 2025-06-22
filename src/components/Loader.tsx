interface LoaderProps {
  title?: string;
  message?: string;
}

export default function Loader({ 
  title = "Loading", 
  message = "Please wait..." 
}: LoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-2xl shadow-xl border border-gray-200/50">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-blue-400 opacity-20" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
} 