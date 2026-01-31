'use client'

import { useState } from 'react'
import { Wand2, Loader2, Check, RefreshCw, Copy, Sparkles } from 'lucide-react'

interface ProductAutoFillProps {
  productName: string
  brandName: string
  category: string
  initialDescription?: string
  onApply?: (details: GeneratedDetails) => void
}

interface GeneratedDetails {
  description: string
  tastingNotes?: {
    nose: string
    palate: string
    finish: string
  }
  keywords: string[]
  suggestedPrice: {
    min: number
    max: number
  }
  channels: string[]
  pairings: string[]
}

export default function ProductAutoFill({
  productName,
  brandName,
  category,
  initialDescription,
  onApply,
}: ProductAutoFillProps) {
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState<GeneratedDetails | null>(null)
  const [copied, setCopied] = useState(false)

  const generateDetails = async () => {
    setLoading(true)

    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2500))

      const isAlcohol = ['wine', 'spirits', 'beer', 'cider', 'rtd'].includes(category.toLowerCase())

      const mockDetails: GeneratedDetails = {
        description: `Discover ${productName} from ${brandName}, a ${category.toLowerCase()} that embodies the finest traditions of British craft. ${
          isAlcohol
            ? 'Carefully crafted using time-honoured techniques and the finest ingredients, this exceptional product offers a sophisticated drinking experience.'
            : 'Made with premium ingredients and expert craftsmanship, this product delivers exceptional quality in every sip.'
        }\n\nPerfect for those who appreciate quality and authenticity, ${productName} makes an excellent choice for special occasions or everyday enjoyment. ${
          isAlcohol
            ? 'Best served chilled for optimal flavour appreciation.'
            : 'Enjoy chilled or at room temperature.'
        }`,
        tastingNotes: isAlcohol
          ? {
              nose: 'Opens with bright, inviting aromas of fresh fruit and subtle botanical notes, complemented by hints of citrus zest.',
              palate: 'Smooth and well-balanced on the palate with layers of complexity. Notes of vanilla and spice develop mid-palate.',
              finish: 'Long, satisfying finish with lingering warmth and a touch of sweetness.',
            }
          : undefined,
        keywords: [
          productName.toLowerCase(),
          brandName.toLowerCase(),
          category.toLowerCase(),
          'uk',
          'premium',
          'craft',
          'artisan',
          'british',
          'quality',
          isAlcohol ? 'alcohol' : 'soft drink',
        ].filter(Boolean),
        suggestedPrice: {
          min: category.toLowerCase() === 'spirits' ? 28 : category.toLowerCase() === 'wine' ? 12 : 4,
          max: category.toLowerCase() === 'spirits' ? 45 : category.toLowerCase() === 'wine' ? 25 : 8,
        },
        channels: [
          { channel: 'Amazon', fit: 'High' },
          { channel: 'D2C Website', fit: 'High' },
          { channel: 'Premium Retailers', fit: 'Medium' },
          { channel: 'Hospitality', fit: 'Medium' },
        ].map(c => `${c.channel} (${c.fit} fit)`),
        pairings: isAlcohol
          ? [
              'Charcuterie and artisan cheeses',
              'Fresh seafood and shellfish',
              'Light appetizers and canapés',
              'Celebration occasions',
            ]
          : ['Light meals', 'Social gatherings', 'Outdoor events', 'Everyday refreshment'],
      }

      setGenerated(mockDetails)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyDescription = () => {
    if (generated?.description) {
      navigator.clipboard.writeText(generated.description)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const applyAll = () => {
    if (generated && onApply) {
      onApply(generated)
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
      <div className="px-6 py-4 border-b border-indigo-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Product Details</h3>
            <p className="text-sm text-gray-500">Auto-generate descriptions & metadata</p>
          </div>
        </div>
        <button
          onClick={generateDetails}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : generated ? (
            <>
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate
            </>
          )}
        </button>
      </div>

      {loading && !generated && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Creating compelling product details...</p>
          <p className="text-sm text-gray-500 mt-1">Analyzing market trends and best practices</p>
        </div>
      )}

      {generated && (
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Product Description</label>
              <button
                onClick={copyDescription}
                className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-700 whitespace-pre-line">{generated.description}</p>
            </div>
          </div>

          {/* Tasting Notes */}
          {generated.tastingNotes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tasting Notes</label>
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <div>
                  <span className="text-xs font-medium text-indigo-600 uppercase">Nose</span>
                  <p className="text-sm text-gray-700">{generated.tastingNotes.nose}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-indigo-600 uppercase">Palate</span>
                  <p className="text-sm text-gray-700">{generated.tastingNotes.palate}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-indigo-600 uppercase">Finish</span>
                  <p className="text-sm text-gray-700">{generated.tastingNotes.finish}</p>
                </div>
              </div>
            </div>
          )}

          {/* Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SEO Keywords</label>
            <div className="flex flex-wrap gap-2">
              {generated.keywords.map((keyword, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-white border border-indigo-200 rounded-full text-sm text-indigo-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Price & Channels */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Price Range</label>
              <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
                <span className="text-2xl font-bold text-gray-900">
                  £{generated.suggestedPrice.min} - £{generated.suggestedPrice.max}
                </span>
                <p className="text-xs text-gray-500 mt-1">Based on UK market analysis</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Channel Recommendations</label>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <ul className="text-sm space-y-1">
                  {generated.channels.map((channel, i) => (
                    <li key={i} className="text-gray-700">{channel}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pairings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Suggested Pairings</label>
            <div className="flex flex-wrap gap-2">
              {generated.pairings.map((pairing, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700"
                >
                  {pairing}
                </span>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          {onApply && (
            <button
              onClick={applyAll}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Apply All Details
            </button>
          )}
        </div>
      )}
    </div>
  )
}
