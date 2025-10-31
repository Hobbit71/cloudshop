import Card from '@components/common/Card'

export default function AnalyticsPage() {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <Card title="Top products"><div className="h-40 bg-gray-100" aria-label="Chart placeholder" /></Card>
      <Card title="Sales by region"><div className="h-40 bg-gray-100" aria-label="Chart placeholder" /></Card>
    </section>
  )
}


