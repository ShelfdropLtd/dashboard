import { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Helper function to get badge variant for order status
export function getOrderStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'approved':
      return 'info'
    case 'dispatched':
      return 'info'
    case 'delivered':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return 'default'
  }
}

// Helper function to get badge variant for invoice status
export function getInvoiceStatusVariant(status: string): BadgeProps['variant'] {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'paid':
      return 'success'
    case 'overdue':
      return 'danger'
    default:
      return 'default'
  }
}
