# Quant Research Lab (`quant-research-lab`)

Welcome to **Quant Research Lab**, an educational quantitative finance research environment designed to discover, model, backtest, and evaluate statistical trading strategies with mathematical rigor and clean Python software engineering.

---

## 🛠 Tech Stack

* **Data Manipulation & Math:** `pandas`, `numpy` (vectorized time-series analysis)
* **Data Sourcing:** `yfinance` (historical Yahoo Finance market data extraction)
* **Statistics & Econometrics:** `scipy`, `statsmodels` (OLS regression, cointegration, unit-root ADF tests)
* **Backtesting Engine:** `vectorbt` / `backtrader` (fast vectorized and event-driven backtesting)
* **Risk & Performance Analytics:** `quantstats` (institutional-grade tear sheets and risk metrics)

---

## 📚 Quantitative Finance 101: Step-by-Step Guide

### Step 1: Fetching Market Data (`yfinance`) & Log Returns

We use `yfinance` to fetch OHLCV (Open, High, Low, Close, Volume) daily prices.

#### Standard vs. Logarithmic Returns
Standard percentage returns do not compound linearly across multiple periods. Quants use **Logarithmic Returns** ($R_t$):

$$R_t = \ln\left(\frac{P_t}{P_{t-1}}\right)$$

Where:
- $P_t$ is the asset close price at day $t$
- $P_{t-1}$ is the asset close price at day $t-1$

#### Rolling Volatility ($\sigma$)
Rolling sample standard deviation over an $N$-day window:

$$\sigma_N = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N} \left( R_i - \bar{R} \right)^2}$$

---

### Step 2: Signal Generation (Momentum & Trend Following)

Trading signals map market data into position states:
- `+1`: Long Position (Buy)
- `-1`: Short Position (Sell)
- `0`: Neutral / Cash

#### Simple Moving Average (SMA) Crossover
We calculate 50-day ($\text{SMA}_{50}$) and 200-day ($\text{SMA}_{200}$) rolling averages:

$$\text{SMA}_k(t) = \frac{1}{k} \sum_{j=0}^{k-1} P_{t-j}$$

- **Golden Cross ($\text{SMA}_{50} > \text{SMA}_{200}$):** Bullish momentum signal ($\text{Signal} = 1$)
- **Death Cross ($\text{SMA}_{50} < \text{SMA}_{200}$):** Bearish momentum signal ($\text{Signal} = -1$)

---

### Step 3: Statistical Arbitrage & Pairs Trading

Pairs trading finds two historically correlated assets ($Y$ and $X$) and trades mean-reverting deviations in their spread.

#### 1. Ordinary Least Squares (OLS) Regression
We fit an OLS linear regression to establish the hedge ratio ($\beta$):

$$Y_t = \beta X_t + \alpha + \epsilon_t$$

Where $\beta$ is the hedge ratio, $\alpha$ is the intercept, and $\epsilon_t$ is the residual spread:

$$\text{Spread}_t = Y_t - (\beta X_t + \alpha)$$

#### 2. Augmented Dickey-Fuller (ADF) Test
We run an ADF unit-root test to verify if $\text{Spread}_t$ is stationary ($I(0)$ mean-reverting).

#### 3. Normalized $Z$-Score Signal
The spread is normalized into a $Z$-score using rolling mean $\mu$ and standard deviation $\sigma$:

$$Z_t = \frac{\text{Spread}_t - \mu_{\text{spread}}}{\sigma_{\text{spread}}}$$

- **Trade Rule:**
  - $Z_t > +2.0 \implies$ Short $Y$, Long $X$ (Signal = $-1$)
  - $Z_t < -2.0 \implies$ Long $Y$, Short $X$ (Signal = $+1$)
  - $|Z_t| \le 0.5 \implies$ Revert / Exit position (Signal = $0$)

---

### Step 4: Backtesting Engine & Transaction Friction

We test strategy signals over historical data, starting with an initial equity $V_0 = \$10,000$.

#### Realistic Transaction Fees
To prevent false performance spikes, every execution deducts a $0.1\%$ transaction fee (broker commission + market slippage):

$$\text{Fee}_t = 0.001 \times \text{Position Size}_t \times P_t$$

---

### Step 5: Risk Analytics & Stress Testing

#### 1. Sharpe Ratio ($S$)
Measures excess return earned per unit of total risk:

$$S = \frac{\mathbb{E}[R_p - R_f]}{\sigma_p}$$

Where $R_p$ is portfolio return, $R_f$ is risk-free rate, and $\sigma_p$ is portfolio annualized volatility.

#### 2. Maximum Drawdown ($MDD$)
The worst peak-to-trough drop in portfolio value:

$$MDD = \max_{\tau \le t} \left( \frac{P_{\text{peak}} - P_\tau}{P_{\text{peak}}} \right)$$

#### 3. Monte Carlo Simulation
Bootstrapping historical trade returns over $N = 10,000$ iterations to compute empirical confidence limits for 95% Value-at-Risk ($\text{VaR}_{95\%}$).

---

## 📁 Repository Structure

```
quant-research-lab/
├── 01_data_pipeline/      # Phase 1: Fetching yfinance data, log returns & Parquet/CSV export
├── 02_signals/            # Phase 2: Technical indicator signals (SMA 50/200 Crossover)
├── 03_stats_models/       # Phase 3: Pairs trading (OLS regression, ADF test & Z-score)
├── 04_backtesting/        # Phase 4: VectorBT backtesting engine with transaction fees
├── 05_performance/        # Phase 5: QuantStats reporting & 10k Monte Carlo stress tests
├── pyproject.toml         # UV project configuration and dependencies
└── README.md              # Documentation with LaTeX mathematical formulas
```

---

## 🚀 Quick Start Guide

### Installation (`uv`)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/quant-research-lab.git
   cd quant-research-lab
   ```

2. **Sync Virtual Environment:**
   ```bash
   uv sync
   ```

3. **Run Pipeline Scripts Step-by-Step:**
   ```bash
   # Step 1: Data Pipeline
   uv run python 01_data_pipeline/download_data.py

   # Step 2: Signals
   uv run python 02_signals/generate_signals.py

   # Step 3: Statistical Modeling
   uv run python 03_stats_models/pairs_trading.py

   # Step 4: Backtesting Engine
   uv run python 04_backtesting/backtest_engine.py

   # Step 5: Risk Analytics
   uv run python 05_performance/risk_analytics.py
   ```

4. **Launch Interactive Jupyter Notebook:**
   ```bash
   uv run jupyter notebook
   ```

---

## 📄 License
MIT License
