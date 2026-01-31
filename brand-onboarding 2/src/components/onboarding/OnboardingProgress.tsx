'use client'

import { Check, Clock, FileText, Package, PenTool, Truck, Sparkles } from 'lucide-react'

const STAGES = [
  { id: 'application', label: 'Application', icon: FileText },
  { id: 'pending_review', label: 'Review', icon: Clock },
  { id: 'pricing_review', label: 'Pricing', icon: Package },
  { id: 'pricing_accepted', label: 'Accept', icon: Check },
  { id: 'contract_signing', label: 'Contracts', icon: PenTool },
  { id: 'shipping_setup', label: 'Shipping', icon: Truck },
  { id: 'onboarding_complete', label: 'Complete', icon: Sparkles },
]

interface OnboardingProgressProps {
  currentStage: string
  className?: string
}

export default function OnboardingProgress({ currentStage, className = '' }: OnboardingProgressProps) {
  const currentIndex = STAGES.findIndex(s => s.id === currentStage)

  return (
    <div className={`bg-white border-b ${className}`}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {STAGES.map((stage, index) => {
            const Icon = stage.icon
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex
            const isPending = index > currentIndex

            return (
              <div key={stage.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isCurrent ? 'bg-brand-accent text-white ring-4 ring-brand-accent/20' : ''}
                      ${isPending ? 'bg-gray-100 text-gray-400' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`
                      mt-2 text-xs font-medium
                      ${isCompleted ? 'text-green-600' : ''}
                      ${isCurrent ? 'text-brand-accent' : ''}
                      ${isPending ? 'text-gray-400' : ''}
                    `}
                  >
                    {stage.label}
                  </span>
                </div>

                {index < STAGES.length - 1 && (
                  <div
                    className={`
                      w-12 h-0.5 mx-2
                      ${index < currentIndex ? 'bg-green-500' : 'bg-gray-200'}
                    `}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
