import { NewsCategoriesView } from './_components/news-categories-view'

export default function NewsCategoriesPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-cinzel text-xl font-bold text-w-950">Article Categories</h1>
        <p className="font-lato text-sm text-w-600 mt-1">Manage the categories editors can assign to news articles.</p>
      </div>
      <NewsCategoriesView />
    </div>
  )
}
