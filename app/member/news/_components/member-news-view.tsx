"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertCircle, Newspaper, Search } from "lucide-react";
import { RemoteImage } from "@/components/ui/remote-image";
import type { NewsArticle } from "@/app/dashboard/news/_shared/news-data";

export default function MemberNewsView() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/news/articles?pageSize=100&status=PUBLISHED")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.code !== "success") throw new Error(payload.message ?? "Could not load news");
        setArticles(payload.data);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load news"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = articles.filter((article) => {
    const term = query.toLowerCase().trim();
    return !term || `${article.title} ${article.summary} ${article.category}`.toLowerCase().includes(term);
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-w-600 font-lato">Member library</p>
          <h1 className="font-cinzel text-2xl font-semibold text-w-950">News & Newspapers</h1>
          <p className="font-lato text-sm text-w-700 mt-1">Read the latest published articles and editions from Kingdom Library.</p>
        </div>
        <label className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-w-600" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search news" className="w-full pl-9 pr-3 py-2.5 rounded border border-w-300 bg-white text-sm font-lato focus:outline-none focus:border-w-600" />
        </label>
      </header>

      {loading && <div className="py-12 text-center text-sm text-w-600 font-lato">Loading published news...</div>}
      {error && <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-lato"><AlertCircle size={16} /> {error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="py-12 text-center text-sm text-w-600 font-lato">No published news matches your search.</div>}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((article) => (
            <Link key={article.id} href={`/member/news/${article.id}`} className="group overflow-hidden rounded-lg border border-w-300 bg-white hover:border-w-600 transition-colors">
              <div className="relative h-40 bg-w-100">
                {article.coverImage ? <RemoteImage src={article.coverImage} alt={article.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" fallback={<Placeholder />} /> : <Placeholder />}
              </div>
              <div className="p-4">
                <p className="text-[11px] uppercase tracking-wide text-w-600 font-lato">{article.isEdition ? "Edition" : article.category}</p>
                <h2 className="mt-1 font-cinzel text-base font-semibold text-w-950 group-hover:text-w-600">{article.title}</h2>
                <p className="mt-2 text-sm text-w-700 font-lato line-clamp-3">{article.summary}</p>
                <p className="mt-4 text-xs text-w-600 font-lato">{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Published"}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Placeholder() {
  return <div className="h-full flex items-center justify-center text-w-400"><Newspaper size={32} /></div>;
}
