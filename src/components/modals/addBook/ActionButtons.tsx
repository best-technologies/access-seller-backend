interface Props {
  isLoading: boolean;
}

export default function ActionButtons({ isLoading }: Props) {
  return (
    <div className="flex items-center justify-end pt-6 border-t border-gray-100">
      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-green-400 focus:ring-offset-2 active:scale-95 transition-transform"
      >
        {isLoading ? (
          <>
            {/* Loader icon here */}
            Creating Book...
          </>
        ) : (
          <>
            {/* Plus icon here */}
            Create Book
          </>
        )}
      </button>
    </div>
  );
} 