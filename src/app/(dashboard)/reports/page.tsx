export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Truck,
  Receipt,
  Download,
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import ReportsCharts from './ReportsCharts'

export default async function BrandReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user's brand
  const { data: brand } = await supabase
    .from('brands')
    .select('id, company_name, name')
    .eq('user_id', user.id)
    .single()

  if (!brand) {
    redirect('/onboarding')
  }

  // Get current month dates
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // Get transactions for current and last month
  const { data: currentMonthTx } = await supabase
    .from('brand_transactions')
    .select('*')
    .eq('brand_id', brand.id)
    .eq('period_year', currentYear)
    .eq('period_month', currentMonth)

  const { data: lastMonthTx } = await supabase
    .from('brand_transactions')
    .select('*')
    .eq('brand_id', brand.id)
    .eq('period_year', lastMonthYear)
    .eq('period_month', lastMonth)

  // Get all transactions for chart
  const { data: allTransactions } = await supabase
    .from('brand_transactions')
    .select('*')
    .eq('brand_id', brand.id)
    .order('transaction_date', { ascending: true })

  // Get outbound shipments for fulfilment costs
  const { data: shipments } = await supabase
    .from('outbound_shipments')
    .select('total_cost, created_at')
    .eq('brand_id', brand.id)

  // Get duty entries
  const { data: duties } = await supabase
    .from('duty_entries')
    .select('total_duty_amount, entry_date')
    .eq('brand_id', brand.id)
    .eq('status', 'charged')

  // Calculate metrics
  const calculateMetrics = (transactions: any[] | null) => {
    if (!transactions || transactions.length === 0) {
      return {
        revenue: 0,
        commission: 0,
        fulfilment: 0,
        duties: 0,
        promotions: 0,
        storage: 0,
        refunds: 0,
        net: 0,
      }
    }

    return {
      revenue: transactions.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + t.amount, 0),
      commission: Math.abs(transactions.filter(t => t.transaction_type === 'commission').reduce((s, t) => s + t.amount, 0)),
      fulfilment: Math.abs(transactions.filter(t => t.transaction_type === 'fulfilment').reduce((s, t) => s + t.amount, 0)),
      duties: Math.abs(transactions.filter(t => t.transaction_type === 'duty').reduce((s, t) => s + t.amount, 0)),
      promotions: Math.abs(transactions.filter(t => t.transaction_type === 'promotion_funding').reduce((s, t) => s + t.amount, 0)),
      storage: Math.abs(transactions.filter(t => t.transaction_type === 'storage').reduce((s, t) => s + t.amount, 0)),
      refunds: Math.abs(transactions.filter(t => t.transaction_type === 'refund').reduce((s, t) => s + t.amount, 0)),
      net: transactions.reduce((s, t) => s + t.amount, 0),
    }
  }

  const currentMetrics = calculateMetrics(currentMonthTx)
  const lastMetrics = calculateMetrics(lastMonthTx)

  // Calculate changes
  const revenueChange = lastMetrics.revenue > 0
    ? ((currentMetrics.revenue - lastMetrics.revenue) / lastMetrics.revenue) * 100
    : 0
  const netChange = lastMetrics.net !== 0
    ? ((currentMetrics.net - lastMetrics.net) / Math.abs(lastMetrics.net)) * 100
    : 0

  // Calculate YTD
  const ytdTransactions = allTransactions?.filter(t => t.period_year === currentYear) || []
  const ytdMetrics = calculateMetrics(ytdTransactions)

  // Total fulfilment costs
  const totalFulfilmentCosts = shipments?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0

  // Total duties
  const totalDuties = duties?.reduce((sum, d) => sum + (d.total_duty_amount || 0), 0) || 0

  // Chart data - monthly breakdown
  const chartData = []
  for (let m = 1; m <= 12; m++) {
    const monthTx = allTransactions?.filter(t => t.period_year === currentYear && t.period_month === m) || []
    const metrics = calculateMetrics(monthTx)
    chartData.push({
      month: new Date(currentYear, m - 1).toLocaleString('en-GB', { month: 'short' }),
      revenue: metrics.revenue,
      costs: metrics.commission + metrics.fulfilment + metrics.duties + metrics.promotions + metrics.storage,
      net: metrics.net,
    })
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-shelfdrop-blue">Reports & P&L</h1>
          <p className="text-gray-600">Financial performance and analytics</p>
        </div>
        <div className="flex gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4" />
            {monthNames[currentMonth - 1]} {currentYear}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            {revenueChange !== 0 && (
              <span className={`text-sm font-medium flex items-center gap-1 ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Revenue This Month</p>
          <p className="text-2xl font-bold text-gray-900">£{currentMetrics.revenue.toFixed(2)}</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            {netChange !== 0 && (
              <span className={`text-sm font-medium flex items-center gap-1 ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netChange >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(netChange).toFixed(1)}%
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">Net Profit This Month</p>
          <p className={`text-2xl font-bold ${currentMetrics.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            £{currentMetrics.net.toFixed(2)}
          </p>
        </div>

        {/* YTD Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">YTD Revenue</p>
          <p className="text-2xl font-bold text-gray-900">£{ytdMetrics.revenue.toFixed(2)}</p>
        </div>

        {/* YTD Net */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <PieChart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500">YTD Net Profit</p>
          <p className={`text-2xl font-bold ${ytdMetrics.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            £{ytdMetrics.net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-6">Monthly Performance {currentYear}</h2>
        <ReportsCharts data={chartData} />
      </div>

      {/* P&L Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Current Month P&L */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {monthNames[currentMonth - 1]} P&L Statement
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Revenue */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="font-medium text-gray-900">Gross Revenue</span>
                <span className="text-lg font-semibold text-green-600">
                  +£{currentMetrics.revenue.toFixed(2)}
                </span>
              </div>

              {/* Costs */}
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Commission (Shelfdrop)</span>
                  <span className="text-red-600">-£{currentMetrics.commission.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fulfilment Costs</span>
                  <span className="text-red-600">-£{currentMetrics.fulfilment.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Duty Charges</span>
                  <span className="text-red-600">-£{currentMetrics.duties.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Promotion Funding</span>
                  <span className="text-red-600">-£{currentMetrics.promotions.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Storage Fees</span>
                  <span className="text-red-600">-£{currentMetrics.storage.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Refunds</span>
                  <span className="text-red-600">-£{currentMetrics.refunds.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Costs */}
              <div className="flex items-center justify-between py-3 border-t border-gray-200">
                <span className="font-medium text-gray-700">Total Costs</span>
                <span className="font-semibold text-red-600">
                  -£{(currentMetrics.commission + currentMetrics.fulfilment + currentMetrics.duties + currentMetrics.promotions + currentMetrics.storage + currentMetrics.refunds).toFixed(2)}
                </span>
              </div>

              {/* Net */}
              <div className="flex items-center justify-between py-4 bg-gray-50 rounded-lg px-4 -mx-4">
                <span className="font-bold text-gray-900">Net Profit</span>
                <span className={`text-xl font-bold ${currentMetrics.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  £{currentMetrics.net.toFixed(2)}
                </span>
              </div>

              {/* Margin */}
              {currentMetrics.revenue > 0 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">
                    Net Margin: {((currentMetrics.net / currentMetrics.revenue) * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Total Costs Breakdown</h2>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {/* Fulfilment */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Fulfilment</p>
                      <p className="text-xs text-gray-500">Shipping, handling, packaging</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">£{totalFulfilmentCosts.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (totalFulfilmentCosts / (totalFulfilmentCosts + totalDuties + currentMetrics.commission)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Duties */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Duties</p>
                      <p className="text-xs text-gray-500">Excise duty on releases</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">£{totalDuties.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (totalDuties / (totalFulfilmentCosts + totalDuties + currentMetrics.commission)) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Commission */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Commission</p>
                      <p className="text-xs text-gray-500">£2 per bottle</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-900">£{currentMetrics.commission.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (currentMetrics.commission / (totalFulfilmentCosts + totalDuties + currentMetrics.commission)) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 p-4 bg-shelfdrop-yellow/20 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>How we calculate your margin:</strong> You keep approximately 70%+ of the retail price.
                Our commission is £2 per bottle, plus actual fulfilment and duty costs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Comparison */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Month-over-Month Comparison</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500">
                  <th className="pb-4">Metric</th>
                  <th className="pb-4 text-right">{monthNames[lastMonth - 1]}</th>
                  <th className="pb-4 text-right">{monthNames[currentMonth - 1]}</th>
                  <th className="pb-4 text-right">Change</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-t border-gray-100">
                  <td className="py-3 font-medium">Revenue</td>
                  <td className="py-3 text-right">£{lastMetrics.revenue.toFixed(2)}</td>
                  <td className="py-3 text-right">£{currentMetrics.revenue.toFixed(2)}</td>
                  <td className={`py-3 text-right font-medium ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="py-3 font-medium">Net Profit</td>
                  <td className="py-3 text-right">£{lastMetrics.net.toFixed(2)}</td>
                  <td className="py-3 text-right">£{currentMetrics.net.toFixed(2)}</td>
                  <td className={`py-3 text-right font-medium ${netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netChange >= 0 ? '+' : ''}{netChange.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="py-3 font-medium">Commission</td>
                  <td className="py-3 text-right">£{lastMetrics.commission.toFixed(2)}</td>
                  <td className="py-3 text-right">£{currentMetrics.commission.toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-500">—</td>
                </tr>
                <tr className="border-t border-gray-100">
                  <td className="py-3 font-medium">Fulfilment</td>
                  <td className="py-3 text-right">£{lastMetrics.fulfilment.toFixed(2)}</td>
                  <td className="py-3 text-right">£{currentMetrics.fulfilment.toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-500">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
