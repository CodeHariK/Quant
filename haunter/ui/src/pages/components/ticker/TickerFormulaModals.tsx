import { Accessor, Setter } from 'solid-js';
import { Modal } from '../../../primitives/Modal';

export interface TickerFormulaModalsProps {
  activeModal: Accessor<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | 'watchlist' | 'peg' | 'earningsYield' | null>;
  setActiveModal: Setter<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | 'watchlist' | 'peg' | 'earningsYield' | null>;
}

export function TickerFormulaModals(props: TickerFormulaModalsProps) {
  return (
    <>
{/* Formula Explanation Modals */}
      <Modal
        isOpen={props.activeModal() === 'peg'}
        onClose={() => props.setActiveModal(null)}
        title="PEG Ratio (Price/Earnings-to-Growth)"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          PEG Ratio = Trailing P/E / Annual Earnings Growth Rate (%)
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Overview:</strong> The PEG ratio adjusts the standard Price-to-Earnings ratio by taking the company's expected earnings growth rate into account.</p>
          <p><strong>Interpretation Guide:</strong></p>
          <ul class="list-disc list-inside space-y-1 text-on-surface-variant">
            <li><strong>PEG &lt; 1.0 (CHEAP):</strong> The stock is trading at a discount relative to its annual earnings growth rate. High growth at a bargain valuation.</li>
            <li><strong>1.0 &le; PEG &le; 2.0 (FAIR):</strong> Fairly valued relative to earnings growth.</li>
            <li><strong>PEG &gt; 2.0 (EXPENSIVE):</strong> You are paying a heavy valuation premium for limited earnings growth.</li>
          </ul>
        </div>
      </Modal>

      <Modal
        isOpen={props.activeModal() === 'earningsYield'}
        onClose={() => props.setActiveModal(null)}
        title="Earnings Yield (Equity Yield vs Risk-Free Rate)"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          Earnings Yield (%) = (Earnings Per Share / Current Stock Price) &times; 100
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Overview:</strong> Earnings Yield is the reciprocal of the Price-to-Earnings ratio (1 / PE). It measures the percentage of net profit the company generates per dollar invested in the stock.</p>
          <p><strong>Risk-Free Hurdle Rate Comparison:</strong> Evaluated against the <strong>7.0% RBI Risk-Free Benchmark Rate</strong>.</p>
          <ul class="list-disc list-inside space-y-1 text-on-surface-variant">
            <li><strong>Yield &ge; 7.0% (BEATS RISK-FREE):</strong> The equity investment yields more return than guaranteed risk-free government bonds.</li>
            <li><strong>Yield &lt; 7.0% (BELOW RISK-FREE):</strong> The stock yields less than risk-free treasury bonds. The stock is mathematically overvalued unless earnings grow rapidly.</li>
          </ul>
        </div>
      </Modal>

      {/* Formula Explanation Modals */}
      <Modal
        isOpen={props.activeModal() === 'sharpe'}
        onClose={() => props.setActiveModal(null)}
        title="Sharpe Ratio (Risk-Adjusted Return)"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          Sharpe Ratio = (Rp - Rf) / σp
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Rp:</strong> Annualized return of the stock computed over 5 years of daily price closes.</p>
          <p><strong>Rf:</strong> Risk-free rate of return (assumed at 7.0% based on standard RBI 10Y Indian Govt Bonds / US Treasury yields).</p>
          <p><strong>σp:</strong> Annualized standard deviation (volatility) of total daily returns (scaled across 252 trading days).</p>
        </div>
        <div class="border-t border-outline-variant pt-2 text-[11px] text-outline-variant">
          <strong>Grade Scale:</strong> &ge;3.0 (Excellent) | &ge;2.0 (Very Good) | &ge;1.0 (Good) | &ge;0 (Acceptable) | &lt;0 (Poor).
        </div>
      </Modal>

      <Modal
        isOpen={props.activeModal() === 'sortino'}
        onClose={() => props.setActiveModal(null)}
        title="Sortino Ratio (Downside Risk-Adjusted)"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          Sortino Ratio = (Rp - Rf) / σd
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Rp:</strong> Annualized return of the stock over 5 years.</p>
          <p><strong>Rf:</strong> Risk-free rate of return (7.0%).</p>
          <p><strong>σd:</strong> Downside volatility. Unlike Sharpe ratio which penalizes both upside and downside price swings, Sortino only calculates volatility for negative daily returns below the risk-free rate.</p>
        </div>
        <div class="border-t border-outline-variant pt-2 text-[11px] text-outline-variant">
          A high Sortino ratio relative to Sharpe indicates that most of the stock's volatility comes from positive upside growth rallies!
        </div>
      </Modal>

      <Modal
        isOpen={props.activeModal() === 'volatility'}
        onClose={() => props.setActiveModal(null)}
        title="Annualized Volatility (%)"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          Annualized Volatility = Standard Deviation(Daily Returns) × √252
        </p>
        <div class="space-y-2 text-xs">
          <p>Measures the dispersion of price returns around their mean over a 252-day trading year.</p>
          <p>Higher volatility means larger price swings, requiring wider risk management and position sizing.</p>
        </div>
      </Modal>

      <Modal
        isOpen={props.activeModal() === 'drawdown'}
        onClose={() => props.setActiveModal(null)}
        title="Maximum 5-Year Drawdown (%)"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          Max Drawdown = (Peak Value - Trough Value) / Peak Value
        </p>
        <div class="space-y-2 text-xs">
          <p>Measures the worst historical loss an investor would have suffered buying at the 5-year peak before price bottomed out.</p>
        </div>
      </Modal>

      <Modal
        isOpen={props.activeModal() === 'dcf'}
        onClose={() => props.setActiveModal(null)}
        title="1-Year Recency-Weighted Monthly Mean Valuation Engine"
      >
        <p class="font-mono bg-surface-container p-3 border border-outline-variant text-center font-bold">
          Fair Value Target = ∑ [ Month_Mean × Weight ] / Total_Weights (12 Months)
        </p>
        <div class="space-y-2 text-xs">
          <p><strong>Monthly High/Low Mean:</strong> Takes `(Monthly High + Monthly Low) / 2` for each of the past 12 months.</p>
          <p><strong>Linear Recency Weighting:</strong> Gives higher weight to more recent months (Month 12 weight = 12, Month 1 weight = 1).</p>
          <p><strong>Monthly Volatility Percentage Range 🔮:</strong> Calculates `(Monthly High - Monthly Low) / MonthAvg` for each month, averages the % spread across 12 months, and applies this mean % volatility to forecast next month's expected price range.</p>
          <p><strong>Margin of Safety:</strong> % Discount or Premium of the current stock market price relative to the 1-Year weighted average mean price.</p>
          <div class="bg-surface p-3 border border-outline-variant mt-2">
            <p class="font-bold text-on-surface mb-1">Buy/Sell Zone Guide:</p>
            <ul class="list-disc list-inside space-y-1 text-on-surface-variant">
              <li><strong>STRONG BUY / BUY:</strong> Stock is trading at a &gt;3-10% discount below its recency-weighted mean.</li>
              <li><strong>HOLD:</strong> Stock is trading close to its 1-year recency-weighted mean.</li>
              <li><strong>SELL / STRONG SELL:</strong> Stock is trading at a &gt;3-10% premium above its recency-weighted mean.</li>
            </ul>
          </div>
        </div>
      </Modal>


    </>
  );
}
