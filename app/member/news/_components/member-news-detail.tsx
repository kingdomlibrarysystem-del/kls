"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, AlertCircle, Newspaper } from "lucide-react";
import type { NewsArticle } from "@/app/dashboard/news/_shared/news-data";

export default function MemberNewsDetail({ id }: { id: string }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/news/articles/${id}`)
      .then((response) => response.json())
      .then((payload) => {
        if (payload.code !== "success" || !payload.data) throw new Error(payload.message ?? "Article not found");
        setArticle(payload.data);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Article not found"));
  }, [id]);

  if (error) return <div className="max-w-3xl mx-auto space-y-4"><Link href="/member/news" className="inline-flex items-center gap-2 text-sm text-w-700 font-lato"><ArrowLeft size={15} /> Back to news</Link><div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-lato"><AlertCircle size={16} /> {error}</div></div>;
  if (!article) return <div className="py-12 text-center text-sm text-w-600 font-lato">Loading article...</div>;

  return (
    <article className="max-w-3xl mx-auto space-y-5">
      <Link href="/member/news" className="inline-flex items-center gap-2 text-sm text-w-700 hover:text-w-950 font-lato"><ArrowLeft size={15} /> Back to news</Link>
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-w-600 font-lato">{article.isEdition ? "Edition" : article.category}</p>
        <h1 className="mt-2 font-cinzel text-3xl font-semibold text-w-950">{article.title}</h1>
        <p className="mt-3 text-sm text-w-600 font-lato">By {article.authorName} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : "Published"}</p>
      </header>
      <div className="rounded-lg border border-w-300 bg-white p-5 sm:p-8">
        <p className="text-base leading-7 text-w-800 font-lato font-semibold">{article.summary}</p>
        <div className="mt-6 border-t border-w-200 pt-6 whitespace-pre-wrap text-sm leading-7 text-w-800 font-lato">{article.content}</div>
      </div>
      <div className="flex items-center gap-2 text-xs text-w-600 font-lato"><Newspaper size={14} /> Published by Kingdom Library</div>
    </article>
  );
}
