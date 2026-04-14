export default function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 animate-pulse">
      <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
      <div className="h-6 bg-gray-200 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded mb-2 w-full"></div>
      <div className="h-4 bg-gray-200 rounded mb-3 w-2/3"></div>
      <div className="h-10 bg-gray-200 rounded w-full"></div>
    </div>
  );
}