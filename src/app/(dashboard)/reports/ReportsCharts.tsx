'use client'

import { useEffect, useRef } from 'react'

interface ChartData {
  month: string
  revenue: number
  costs: number
  net: number
}

export default function ReportsCharts({ data }: { data: ChartData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Clear canvas
    const width = canvasRef.current.width
    const height = canvasRef.current.height
    ctx.clearRect(0, 0, width, height)

    // Find max value for scaling
    const maxValue = Math.max(...data.map(d => Math.max(d.revenue, Math.abs(d.net)))) || 1000
    const padding = 60
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2
    const barWidth = (chartWidth / data.length) * 0.3
    const barGap = (chartWidth / data.length) * 0.1

    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()

      // Y-axis labels
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'right'
      const value = maxValue - (maxValue / 4) * i
      ctx.fillText(`£${(value / 1000).toFixed(0)}k`, padding - 10, y + 4)
    }

    // Draw bars
    data.forEach((d, i) => {
      const x = padding + (chartWidth / data.length) * i + barGap

      // Revenue bar (green)
      const revenueHeight = (d.revenue / maxValue) * chartHeight
      ctx.fillStyle = '#A9EC19'
      ctx.fillRect(x, padding + chartHeight - revenueHeight, barWidth, revenueHeight)

      // Net profit bar (blue or red)
      const netHeight = (Math.abs(d.net) / maxValue) * chartHeight
      ctx.fillStyle = d.net >= 0 ? '#0d23c6' : '#EF4444'
      ctx.fillRect(x + barWidth + 5, padding + chartHeight - netHeight, barWidth, netHeight)

      // X-axis label
      ctx.fillStyle = '#6B7280'
      ctx.font = '12px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText(d.month, x + barWidth, height - 20)
    })

    // Legend
    ctx.fillStyle = '#A9EC19'
    ctx.fillRect(width - 150, 20, 12, 12)
    ctx.fillStyle = '#374151'
    ctx.font = '12px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText('Revenue', width - 132, 30)

    ctx.fillStyle = '#0d23c6'
    ctx.fillRect(width - 150, 40, 12, 12)
    ctx.fillText('Net Profit', width - 132, 50)

  }, [data])

  return (
    <div className="w-full h-80">
      <canvas
        ref={canvasRef}
        width={800}
        height={320}
        className="w-full h-full"
        style={{ maxWidth: '100%' }}
      />
    </div>
  )
}
