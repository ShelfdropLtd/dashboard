// AI Prompts and utilities for Shelfdrop Brand Portal

export const AI_PROMPTS = {
  // Brand Research & Analysis Prompt
  BRAND_ANALYSIS: `You are a drinks industry analyst for Shelfdrop, a UK drinks distribution company.

Analyze this brand application and provide insights:

Brand Name: {{brandName}}
Company: {{companyName}}
Website: {{website}}
Description: {{description}}
Product Categories: {{categories}}
Contact: {{contactName}} ({{email}})

Please provide:
1. **Brand Overview** - A brief summary of who they are and what they offer
2. **Market Position** - How they fit in the UK drinks market
3. **Product Assessment** - Quality indicators based on their range
4. **Channel Potential** - Which sales channels would work best (Amazon, D2C, Trade, Retail)
5. **Risk Assessment** - Any concerns or red flags
6. **Recommendation** - Approve, needs more info, or decline with reasoning
7. **Suggested Actions** - What to discuss in the onboarding call

Be thorough but concise. Focus on actionable insights.`,

  // AWRS Verification Prompt
  AWRS_VERIFICATION: `Analyze this AWRS (Alcohol Wholesaler Registration Scheme) number:

AWRS Number: {{awrsNumber}}
Company Name: {{companyName}}
Registered Address: {{address}}

Please verify:
1. Does the format appear valid? (XAAW00000123456)
2. Does the company name match typical AWRS registrations?
3. Any concerns about the registration?

Note: This is a preliminary check. Final verification should be done via HMRC lookup.`,

  // Product Detail Auto-fill Prompt
  PRODUCT_AUTOFILL: `You are helping fill in product details for a drinks product listing.

Given this information:
Product Name: {{productName}}
Brand: {{brandName}}
Category: {{category}}
Initial Description: {{description}}

Generate comprehensive product details:
1. **Full Description** (2-3 paragraphs, engaging, SEO-friendly)
2. **Tasting Notes** (if applicable - nose, palate, finish)
3. **Suggested Keywords** (for search optimization)
4. **Suggested Price Range** (based on similar products in UK market)
5. **Best Selling Channels** (Amazon, D2C, Trade recommendations)
6. **Pairing Suggestions** (food or occasions)

Make it professional and suitable for e-commerce listings.`,

  // Sales Insights Prompt
  SALES_INSIGHTS: `Analyze this sales data for {{brandName}}:

Monthly Revenue: £{{revenue}}
Units Sold: {{units}}
Top Products: {{topProducts}}
Channel Breakdown: {{channels}}
Month-over-Month Change: {{change}}%

Provide:
1. **Performance Summary** - How are they doing?
2. **Trends** - What patterns do you see?
3. **Opportunities** - Where can they grow?
4. **Recommendations** - 3 actionable suggestions
5. **Concerns** - Any issues to address?

Keep it practical and focused on driving sales.`,

  // Market Expansion Assessment
  MARKET_EXPANSION: `Assess expansion potential for {{brandName}}:

Current Channels: {{currentChannels}}
Product Range: {{products}}
Current Sales Volume: {{volume}} units/month
Target Market: {{targetMarket}}

Analyze:
1. **Readiness Score** (1-10) for expanding to {{targetMarket}}
2. **Key Requirements** - What they need to prepare
3. **Timeline Estimate** - How long to get market-ready
4. **Investment Needed** - Approximate costs
5. **Success Factors** - What will make or break the expansion
6. **Similar Brands** - Examples of brands that expanded successfully`,
}

// Types for AI responses
export interface AIBrandAnalysis {
  overview: string
  marketPosition: string
  productAssessment: string
  channelPotential: string[]
  riskAssessment: string
  recommendation: 'approve' | 'needs_info' | 'decline'
  suggestedActions: string[]
  confidence: number
}

export interface AIProductDetails {
  description: string
  tastingNotes?: {
    nose: string
    palate: string
    finish: string
  }
  keywords: string[]
  priceRange: {
    min: number
    max: number
  }
  channels: string[]
  pairings: string[]
}

export interface AISalesInsights {
  summary: string
  trends: string[]
  opportunities: string[]
  recommendations: string[]
  concerns: string[]
}

// Mock AI function (replace with actual API call in production)
export async function generateAIResponse(prompt: string, variables: Record<string, string>): Promise<string> {
  // Replace variables in prompt
  let filledPrompt = prompt
  for (const [key, value] of Object.entries(variables)) {
    filledPrompt = filledPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }

  // In production, this would call OpenAI/Anthropic API
  // For now, we'll simulate with a delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  return `AI Analysis generated for: ${variables.brandName || variables.productName || 'Unknown'}`
}
