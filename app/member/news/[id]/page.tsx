import MemberNewsDetail from "../_components/member-news-detail";

export default async function MemberNewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MemberNewsDetail id={id} />;
}
