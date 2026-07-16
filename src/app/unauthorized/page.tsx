// src/app/unauthorized/page.tsx
import Image from "next/image";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <div className="flex justify-center pb-4">
          <Image
            src="/SMJaleel%20Logo%20and%20Tagline_FAW_2.svg"
            alt="S.M. Jaleel & Co. Ltd."
            width={220}
            height={85}
            priority
          />
        </div>
        <h1 className="text-xl font-semibold text-[#134395]">Access Restricted</h1>
        <p className="mt-2 text-gray-600">
          You don't have permission to view this page. Contact your Admin if you believe this is a mistake.
        </p>
      </div>
    </div>
  );
}