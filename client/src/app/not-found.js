// app/not-found.js
'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen px-4 text-center">
      <h1 className="text-5xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg text-gray-600 mb-6">
        Sorry, we couldn’t find the page you were looking for.
      </p>
      <Link
        href="/"
        className="text-blue-600 hover:underline text-md font-medium"
      >
        Go back home
      </Link>
    </div>
  );
}
