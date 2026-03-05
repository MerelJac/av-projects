export default function ReportsPage() {
  return (
    <div>

      <h1 className="text-2xl font-semibold mb-6">
        Reports
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white border p-6 rounded-xl">
          <h3 className="text-sm text-gray-500">
            Project Profit
          </h3>
        </div>

        <div className="bg-white border p-6 rounded-xl">
          <h3 className="text-sm text-gray-500">
            WIP Report
          </h3>
        </div>

        <div className="bg-white border p-6 rounded-xl">
          <h3 className="text-sm text-gray-500">
            Invoiced Revenue
          </h3>
        </div>

      </div>

    </div>
  );
}