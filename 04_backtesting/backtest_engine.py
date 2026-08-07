"""
Step 4: Backtesting Engine
Simulates SMA crossover trading signals over historical data starting with $10,000,
accounting for a 0.1% transaction friction fee (commissions + slippage).
"""

from pathlib import Path
import pandas as pd
import vectorbt as vbt

def run_backtest(initial_capital: float = 10000.0, fee: float = 0.001):
    signals_path = Path(__file__).parent.parent / "02_signals" / "data" / "GSPC_sma_signals.parquet"
    if not signals_path.exists():
        raise FileNotFoundError(f"Signal file missing at {signals_path}. Run Step 2 first.")
        
    df = pd.read_parquet(signals_path)
    
    entries = df['Signal'] == 1
    exits = df['Signal'] == -1
    
    print(f"Running VectorBT simulation (Capital=${initial_capital:,.2f}, Friction Fee={fee*100}%)...")
    portfolio = vbt.Portfolio.from_signals(
        df['Close'],
        entries=entries,
        exits=exits,
        init_cash=initial_capital,
        fees=fee,
        freq='D'
    )
    
    stats = portfolio.stats()
    print("\n--- Portfolio Performance Summary ---")
    print(stats)
    
    output_dir = Path(__file__).parent / "data"
    output_dir.mkdir(exist_ok=True)
    trades_df = portfolio.trades.records_readable
    trades_df.to_csv(output_dir / "trade_log.csv")
    print(f"\nTrade logs saved to {output_dir / 'trade_log.csv'}")
    return portfolio

if __name__ == "__main__":
    run_backtest()
