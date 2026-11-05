import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-secondary">
        We couldn&apos;t find that page.{" "}
        <Link href="/" className="text-accent hover:underline">
          Go to the overview
        </Link>
        .
      </p>
    </div>
  );
}
