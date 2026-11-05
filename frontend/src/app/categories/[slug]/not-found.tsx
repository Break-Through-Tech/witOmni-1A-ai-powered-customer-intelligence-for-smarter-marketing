import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold">We couldn&apos;t find that category</h1>
      <p className="mt-2 text-secondary">
        <Link href="/categories" className="text-accent hover:underline">
          See all categories
        </Link>
      </p>
    </div>
  );
}
