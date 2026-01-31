'use client'

import { useState } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertTriangle, XCircle, Building2, Globe, ShoppingBag, TrendingUp, Shield, Lightbulb, RefreshCw } from 'lucide-react'

interface BrandInfo {
  name: string
  companyName: string
  website?: string
  description?: string
  email?: string
  contactName?: string
}

interface AnalysisResult {
  overview: string
  marketPosition: string
  productAssessment: string
  channelPotential: string[]
  risks: string[]
  recommendation: 'approve' | 'needs_info' | 'decline'
  suggestedActions: string[]
  confidence: number
}

export default function BrandAnalysis({ brand }: { brand: BrandInfo }) {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      // Simulate AI analysis (in production, call your AI endpoint)
      await new Promise(resolve => setTimeout(resolve, 2500))

      // Mock analysis result
      const mockAnalysis: AnalysisResult = {
        overview: `${brand.companyName || brand.name} appears to be a craft drinks brand operating in the UK market. Based on initial assessment, they show characteristics of an emerging premium brand with potential for growth through digital channels.`,
        marketPosition: 'Premium/Craft segment targeting discerning consumers who value quality over price. Market position suggests alignment with current consumer trends toward artisanal products.',
        productAssessment: 'Product range appears focused and well-defined. Quality indicators from available information suggest above-average positioning. Recommend requesting samples for full assessment.',
        channelPotential: [
          'Amazon - High potential (strong search demand)',
          'D2C Website - Medium-High (brand storytelling opportunity)',
          'Trade/Wholesale - Medium (requires volume capacity)',
          'Premium Retailers - Medium-High (brand positioning fits)',
        ],
        risks: [
          'Volume capacity to be confirmed',
          'AWRS registration requires verification',
          'Pricing strategy needs review for margin sustainability',
        ],
        recommendation: 'needs_info',
        suggestedActions: [
          'Request product samples for quality assessment',
          'Verify AWRS registration number',
          'Schedule onboarding call to discuss volume commitments',
          'Review pricing structure against market benchmarks',
        ],
        confidence: 78,
      }

      setAnalysis(mockAnalysis)
    } catch (err) {
      setError('Failed to generate analysis. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRecommendationStyle = (rec: string) => {
    switch (rec) {
      case 'approve':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle }
      case 'needs_info':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle }
      case 'decline':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertTriangle }
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
      <div className="px-6 py-4 border-b border-purple-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Brand Analysis</h3>
            <p className="text-sm text-gray-500">Automated research & insights</p>
          </div>
        </div>
        {!analysis && (
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </button>
        )}
        {analysis && (
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Rerun
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && !analysis && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600 mb-4" />
          <p className="text-gray-600">Researching {brand.companyName || brand.name}...</p>
          <p className="text-sm text-gray-500 mt-1">Analyzing market position, products, and potential</p>
        </div>
      )}

      {analysis && (
        <div className="p-6 space-y-6">
          {/* Recommendation Banner */}
          <div className={`p-4 rounded-lg ${getRecommendationStyle(analysis.recommendation).bg} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              {(() => {
                const IconComponent = getRecommendationStyle(analysis.recommendation).icon
                return <IconComponent className={`w-6 h-6 ${getRecommendationStyle(analysis.recommendation).text}`} />
              })()}
              <div>
                <p className={`font-semibold ${getRecommendationStyle(analysis.recommendation).text}`}>
                  {analysis.recommendation === 'approve' && 'Recommended for Approval'}
                  {analysis.recommendation === 'needs_info' && 'More Information Needed'}
                  {analysis.recommendation === 'decline' && 'Not Recommended'}
                </p>
                <p className="text-sm text-gray-600">Confidence: {analysis.confidence}%</p>
              </div>
            </div>
            <div className="w-24 h-2 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-current rounded-full"
                style={{ width: `${analysis.confidence}%`, color: analysis.recommendation === 'approve' ? '#22C55E' : analysis.recommendation === 'needs_info' ? '#EAB308' : '#EF4444' }}
              />
            </div>
          </div>

          {/* Overview */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Brand Overview</h4>
              <p className="text-sm text-gray-600">{analysis.overview}</p>
            </div>
          </div>

          {/* Market Position */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Market Position</h4>
              <p className="text-sm text-gray-600">{analysis.marketPosition}</p>
            </div>
          </div>

          {/* Product Assessment */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Product Assessment</h4>
              <p className="text-sm text-gray-600">{analysis.productAssessment}</p>
            </div>
          </div>

          {/* Channel Potential */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Channel Potential</h4>
              <ul className="space-y-1">
                {analysis.channelPotential.map((channel, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                    {channel}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risks */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Risk Assessment</h4>
              <ul className="space-y-1">
                {analysis.risks.map((risk, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Suggested Next Steps</h4>
              <ol className="space-y-1">
                {analysis.suggestedActions.map((action, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="w-5 h-5 bg-indigo-500 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
