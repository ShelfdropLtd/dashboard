'use client'

import { useState } from 'react'
import { Loader2, CheckCircle, Sparkles, Globe, BarChart3, Target, Calendar } from 'lucide-react'

interface ExpansionInterestFormProps {
  brandId: string
}

interface AssessmentResult {
  readinessScore: number
  recommendations: string[]
  timeline: string
  requirements: string[]
  nextSteps: string[]
}

export default function ExpansionInterestForm({ brandId }: ExpansionInterestFormProps) {
  const [selectedMarket, setSelectedMarket] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [monthlyVolume, setMonthlyVolume] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate AI assessment
      await new Promise(resolve => setTimeout(resolve, 2500))

      const mockAssessment: AssessmentResult = {
        readinessScore: 72,
        recommendations: [
          'Consider starting with a soft launch on the target platform',
          'Develop market-specific product labeling and packaging',
          'Build up inventory levels to meet potential demand surge',
          'Prepare localized marketing materials and product descriptions',
        ],
        timeline: '8-12 weeks to market launch',
        requirements: [
          'Product compliance certification for target market',
          'Localized labeling requirements',
          'Import/export documentation',
          'Local distribution partner or warehouse',
          'Market-specific pricing strategy',
        ],
        nextSteps: [
          'Complete market readiness questionnaire',
          'Schedule call with our expansion team',
          'Submit product samples for compliance review',
          'Review and approve market entry proposal',
        ],
      }

      setAssessment(mockAssessment)
      setSubmitted(true)
    } catch (error) {
      console.error('Submission failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (submitted && assessment) {
    return (
      <div className="space-y-6">
        {/* Success Banner */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Interest Registered!</p>
            <p className="text-sm text-green-600">We've analyzed your expansion potential</p>
          </div>
        </div>

        {/* Readiness Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Expansion Readiness Score
            </h3>
            <span className="text-3xl font-bold text-purple-600">{assessment.readinessScore}/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
              style={{ width: `${assessment.readinessScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {assessment.readinessScore >= 80
              ? 'Excellent! You\'re well-positioned for expansion.'
              : assessment.readinessScore >= 60
              ? 'Good foundation. A few areas need attention.'
              : 'Some preparation required before expansion.'}
          </p>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            Estimated Timeline
          </h3>
          <p className="text-2xl font-bold text-gray-900">{assessment.timeline}</p>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-600" />
            AI Recommendations
          </h3>
          <ul className="space-y-2">
            {assessment.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-700">
                <span className="w-5 h-5 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Key Requirements
          </h3>
          <ul className="space-y-2">
            {assessment.requirements.map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-gray-700">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-shelfdrop-green/20 to-shelfdrop-yellow/20 rounded-lg border border-shelfdrop-green p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
          <ol className="space-y-3">
            {assessment.nextSteps.map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-7 h-7 bg-shelfdrop-green text-black rounded-full text-sm font-medium flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
          <button className="mt-6 w-full py-3 bg-shelfdrop-green text-black font-medium rounded-lg hover:bg-green-400 transition-colors">
            Schedule Expansion Call
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Market
          </label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="">Select a market</option>
            <option value="eu">🇪🇺 European Union</option>
            <option value="us">🇺🇸 United States</option>
            <option value="uae">🇦🇪 UAE</option>
            <option value="aus">🇦🇺 Australia</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel of Interest
          </label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
          >
            <option value="">Select a channel</option>
            <option value="amazon">Amazon Marketplace</option>
            <option value="retail">Retail & Grocery</option>
            <option value="trade">Trade & Wholesale</option>
            <option value="d2c">D2C E-commerce</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Current Monthly Volume (units)
        </label>
        <select
          value={monthlyVolume}
          onChange={(e) => setMonthlyVolume(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">Select volume range</option>
          <option value="0-500">0 - 500 units</option>
          <option value="500-2000">500 - 2,000 units</option>
          <option value="2000-5000">2,000 - 5,000 units</option>
          <option value="5000+">5,000+ units</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing Your Potential...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Get AI Expansion Assessment
          </>
        )}
      </button>
    </form>
  )
}
