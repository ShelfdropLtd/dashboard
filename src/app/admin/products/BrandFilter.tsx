'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Building2 } from 'lucide-react'

interface Brand {
  id: string
  company_name: string | null
  name: string | null
}

interface BrandFilterProps {
  brands: Brand[]
  selectedBrandId?: string
}

export default function BrandFilter({ brands, selectedBrandId }: BrandFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (brandId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (brandId) {
      params.set('brand', brandId)
    } else {
      params.delete('brand')
    }
    router.push(`/admin/products?${params.toString()}`)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="w-5 h-5" />
          <span className="text-sm font-medium">Filter by Brand:</span>
        </div>
        <select
          value={selectedBrandId || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-shelfdrop-green focus:border-transparent"
        >
          <option value="">All Brands</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.company_name || brand.name || 'Unnamed Brand'}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
