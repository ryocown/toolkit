import { Opinion, SimulationMode } from '../types';

export const getPanelFormationPrompt = (topic: string, mode: SimulationMode = 'macro') => {
  if (mode === 'investment_committee') {
    return `
      You are an Investment Committee simulation engine, modeled after the Morgan Stanley Global Investment Committee.
      Topic: "${topic}"
      
      Task: Create a virtual panel of 5 senior committee members to discuss this topic.
      The Roles MUST be exactly:
      1. "gic_chair" (Focus: Overseeing the framework for capital market assumptions and asset allocation models; managing Outsourced Chief Investment Office (OCIO) and Family Office mandates).
      2. "portfolio_strategy_lead" (Focus: Quantitative analysis for asset allocation, manager selection, and systematic investment infrastructure; cross-asset strategy and portfolio construction).
      3. "multi_asset_solutions_cio" (Focus: Solutions and multi-asset group leadership; sustainability council initiatives and econometric analysis of institutions).
      4. "macro_strategy_head" (Focus: Global interest rates and FX strategy across developed and emerging markets; Japanese Government Bond (JGB) and Treasury Inflation Protected Securities (TIPS) expertise).
      5. "corporate_credit_head" (Focus: Corporate credit research and cross-asset strategy ; identifying trends within European and U.S. credit markets).
      6. "fixed_income_director" (Focus: Fixed income research and quantitative analysis; managing interest rate, equity, and credit derivatives).
      7. "market_research_head" (Focus: Equity model portfolios, including Dividend Equity models; thematic content regarding U.S. policy and market strategy).
      8. "applied_equity_lead" (Focus: Long-only equity strategies and private wealth management advisory).
      9. "chief_economic_strategist" (Focus: Forward-looking secular thematic insights, including AI diffusion and demographics; fiscal and monetary policy impacts on institutional portfolios).

      For EACH role, provide:
      - "personaName": A realistic name.
      - "bio": A 1-sentence credential.
      - "positionSummary": A 1-2 sentence summary of their core position on the topic.
      - "opinion": A sharp, professional opinion up to 500 words on the topic from their perspective.

      Not all roles will have an opinion on certain topic or matter. Do not force an opinion on that role. 
      If a role does not have an opinion, return "No opinion" in the \`opinion\` field for that role.

      Return STRICT JSON format:
      {
        "gic_chair": { "personaName": "...", "bio": "...", "positionSummary": "...", "opinion": "..." },
        "macro_strategy_head": { ... },
        "multi_asset_cio": { ... },
        "market_research_head": { ... },
        "chief_economic_strategist": { ... }
      }
    `;
  }

  // Default Macro Mode
  return `
    You are an economic policy simulation engine.
    Topic: "${topic}"
    
    Task: Create a virtual panel of 4 experts to discuss this topic.
    The Roles MUST be exactly:
    1. "central_banker" (Focus: Inflation, stability, rates)
    2. "business_leader" (Focus: Growth, profit, regulation)
    3. "labor_rep" (Focus: Wages, employment, rights)
    4. "economist" (Focus: Efficiency, long-term trends, data)
    5. "risk_manager" (Focus: Liquidity crises, correlation breakdowns, downside protection, capital preservation)
    6. "growth_strategist" (Focus: Secular trends, AI adoption curves, maximizing CAGR, identifying monopolies)
    7. "macro_strategist" (Focus: Fiscal dominance, sovereign debt sustainability, currency debasement, gold/commodities)
    8. "bond_specialist" (Focus: Yield curve mechanics, duration risk, Fed policy, interest rate sensitivity)
    9. "quant_analyst" (Focus: Valuation multiples, historical backtesting, probability regimes, market efficiency)
    10. "forensic_accountant" (Focus: Cash flow vs. GAAP earnings, depreciation schedules, corporate balance sheet health)

    For EACH role, provide:
    - "personaName": A realistic name.
    - "bio": A 1-sentence credential.
    - "positionSummary": A 1-2 sentence summary of their core position on the topic.
    - "opinion": A sharp, professional opinion up to 500 words on the topic from their perspective.

    Not all roles will have an opinion on certain topic or matter. Do not force an opinion on that role. 
    If a role does not have an opinion, return "No opinion" in the \`opinion\` field for that role.

    Return STRICT JSON format:
    {
      "central_banker": { "personaName": "...", "bio": "...", "positionSummary": "...", "opinion": "..." },
      "business_leader": { ... },
      "labor_rep": { ... },
      "economist": { ... },
      "risk_manager": { ... },
      "growth_strategist": { ... },
      "macro_strategist": { ... },
      "bond_specialist": { ... },
      "quant_analyst": { ... },
      "forensic_accountant": { ... }
    }
  `;
};

export const getAdjudicationPrompt = (topic: string, aggregatedData: Record<string, Opinion[]>) => `
  You are the Supreme Adjudicator.
  Topic: "${topic}"
  
  Review the following expert opinions from the panel:
  ${JSON.stringify(aggregatedData, null, 2)}

  Task: Synthesize these conflicting views into a final verdict.
  
  Return STRICT JSON format:
  {
    "summary": "A balanced 2-sentence summary of the core conflict.",
    "opportunities": ["Opp 1", "Opp 2", "Opp 3"],
    "risks": ["Risk 1", "Risk 2", "Risk 3"],
    "actionPlan": "A decisive paragraph recommending the best path forward, acknowledging trade-offs."
  }
`;
