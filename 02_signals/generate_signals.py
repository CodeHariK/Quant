"""
Step 2: Signal Generation
Calculates 50-day and 200-day Simple Moving Averages (SMA) on historical Close prices
and outputs momentum buy (1), sell (-1), and neutral (0) trading signals.
"""

from pathlib import Path
import pandas as pd
import numpy as np

def generate_sma_signals(input_file: Path = None) -> pd.DataFrame:
    base_dir = Path(__file__).parent.parent
    if input_file is None:
        input_file = base_dir / "01_data_pipeline" / "data" / "GSPC_10y_clean.parquet"
        
    if not input_file.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {input_file}. Run Step 1 first.")

    df = pd.read_parquet(input_file)
    
    # Calculate 50-day and 200-day Simple Moving Averages (SMA)
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    df['SMA_200'] = df['Close'].rolling(window=200).mean()
    
    # Golden Cross (1) and Death Cross (-1) signals
    df['Signal'] = 0
    df.loc[df['SMA_50'] > df['SMA_200'], 'Signal'] = 1
    df.loc[df['SMA_50'] < df['SMA_200'], 'Signal'] = -1
    
    # Position changes (entry/exit trigger events)
    df['Position_Change'] = df['Signal'].diff()
    
    output_dir = Path(__file__).parent / "data"
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / "GSPC_sma_signals.parquet"
    df.to_parquet(output_path)
    
    print(f"Signals generated and saved to {output_path}")
    print(df[['Close', 'SMA_50', 'SMA_200', 'Signal', 'Position_Change']].tail(10))
    return df

if __name__ == "__main__":
    generate_sma_signals()
