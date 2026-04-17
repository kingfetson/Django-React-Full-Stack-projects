import AdminLayout from "@/components/AdminLayout";

export default function AdminSettings() {
  return (
    <AdminLayout title="Settings">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-6xl mb-4">⚙️</div>
        <h2 className="text-xl font-semibold mb-2">Settings Coming Soon</h2>
        <p className="text-gray-500">Configure your store settings, payment options, and more.</p>
      </div>
    </AdminLayout>
  );
}