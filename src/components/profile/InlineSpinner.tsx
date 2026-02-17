export default function InlineSpinner({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`inline-block animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${className}`}
      style={{ width: size, height: size }}
    />
  );
} 