// src/app/unauthorized/page.tsx
export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-xl font-semibold text-[#134395]">Access Restricted</h1>
        <p className="mt-2 text-gray-600">
          You don't have permission to view this page. Contact your Admin if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}