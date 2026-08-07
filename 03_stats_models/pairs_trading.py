"""
Step 3: Statistical Modeling (Pairs Trading)
Downloads correlated pair data (PEP vs KO), runs Ordinary Least Squares (OLS)
regression, tests spread stationarity with the Augmented Dickey-Fuller (ADF) test,
and computes mean-reverting Z-score trading signals.
"""

from pathlib import Path
import yfinance as yf
import pandas as pd
import numpy as np
import statsmodels.api as sm
from statsmodels.tsa.stattools import adfuller

def run_pairs_analysis(ticker_y: str = "PEP", ticker_x: str = "KO", period: str = "10y") -> pd.DataFrame:
    output_dir = Path(__file__).parent / "data"
    output_dir.mkdir(exist_ok=True)
    
    print(f"Downloading pair data: {ticker_y} and {ticker_x} ({period})...")
    data = yf.download([ticker_y, ticker_x], period=period, progress=False)['Close']
    data = data.dropna()
    
    Y = data[ticker_y]
    X = data[ticker_x]
    
    # Fit OLS regression: Y = beta * X + alpha
    X_with_const = sm.add_constant(X)
    model = sm.OLS(Y, X_with_const).fit()
    alpha, beta = model.params['const'], model.params[ticker_x]
    
    print("\n--- OLS Regression Results ---")
    print(f"Hedge Ratio (Beta): {beta:.4f}")
    print(f"Intercept (Alpha):  {alpha:.4f}")
    print(f"R-squared:         {model.rsquared:.4f}")
    
    # Calculate Spread: spread = Y - (beta * X + alpha)
    spread = Y - (beta * X + alpha)
    
    # Augmented Dickey-Fuller (ADF) test for stationarity
    adf_result = adfuller(spread)
    print("\n--- Augmented Dickey-Fuller (ADF) Test ---")
    print(f"ADF Statistic: {adf_result[0]:.4f}")
    print(f"p-value:       {adf_result[1]:.4f}")
    print("Critical Values:")
    for key, val in adf_result[4].items():
        print(f"   {key}: {val:.4f}")
        
    is_stationary = adf_result[1] < 0.05
    print(f"Spread Stationary (p < 0.05): {is_stationary}")
    
    # Calculate Z-score of spread
    rolling_mean = spread.rolling(window=30).mean()
    rolling_std = spread.rolling(window=30).std()
    z_score = (spread - rolling_mean) / rolling_std
    
    pair_df = pd.DataFrame({
        ticker_y: Y,
        ticker_x: X,
        'Spread': spread,
        'Z_Score': z_score
    })
    
    # Pairs trading signal:
    # Z > +2 -> Short Y, Long X (Signal = -1)
    # Z < -2 -> Long Y, Short X (Signal = +1)
    # |Z| < 0.5 -> Exit position (Signal = 0)
    pair_df['Signal'] = 0
    pair_df.loc[pair_df['Z_Score'] > 2.0, 'Signal'] = -1
    pair_df.loc[pair_df['Z_Score'] < -2.0, 'Signal'] = 1
    
    output_path = output_dir / f"pairs_{ticker_y}_{ticker_x}.csv"
    pair_df.to_csv(output_path)
    print(f"\nPairs trading dataset saved to {output_path}")
    return pair_df

if __name__ == "__main__":
    run_pairs_analysis()
