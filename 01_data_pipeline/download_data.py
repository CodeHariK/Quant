"""
Step 1: Data Pipeline
Downloads 10 years of daily price data for S&P 500 (^GSPC), cleans NaNs,
computes logarithmic returns, and saves output to clean CSV and Parquet formats.
"""

from pathlib import Path
import yfinance as yf
import pandas as pd
import numpy as np

def run_data_pipeline(symbol: str = "^GSPC", period: str = "10y") -> pd.DataFrame:
    output_dir = Path(__file__).parent / "data"
    output_dir.mkdir(exist_ok=True)
    
    print(f"Downloading historical data for {symbol} ({period})...")
    df = yf.download(symbol, period=period, progress=False)
    
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
        
    df = df[['Open', 'High', 'Low', 'Close', 'Volume']].copy()
    
    # Handle missing values
    df.ffill(inplace=True)
    df.bfill(inplace=True)
    
    # Calculate daily logarithmic returns: R_t = ln(P_t / P_{t-1})
    df['Log_Return'] = np.log(df['Close'] / df['Close'].shift(1))
    
    # 20-day rolling volatility
    df['Volatility_20d'] = df['Log_Return'].rolling(window=20).std()
    
    csv_path = output_dir / f"{symbol.replace('^', '')}_10y_clean.csv"
    parquet_path = output_dir / f"{symbol.replace('^', '')}_10y_clean.parquet"
    
    df.to_csv(csv_path)
    df.to_parquet(parquet_path)
    
    print(f"Data saved successfully to {csv_path} and {parquet_path}")
    print(f"Dataset shape: {df.shape}")
    print(df.tail())
    return df

if __name__ == "__main__":
    run_data_pipeline()
