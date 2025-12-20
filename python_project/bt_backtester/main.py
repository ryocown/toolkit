import bt
import yaml
import os
import sys
from datetime import datetime
from data import DataEngine
import matplotlib.pyplot as plt

import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def load_config(path='config.yaml'):
    if not os.path.exists(path):
        logger.error(f"Config file {path} not found.")
        raise FileNotFoundError(f"Config file {path} not found.")
    with open(path, 'r') as f:
        config = yaml.safe_load(f)
    logger.info(f"Loaded configuration from {path}")
    config['settings']['start_date'] = datetime.strptime(config['settings']['start_date'], '%Y-%m-%d')
    config['settings']['end_date'] = datetime.strptime(config['settings']['end_date'], '%Y-%m-%d')
    return config

def plot_sectoral_allocation(res, metadata, title="Portfolio: Sectoral Allocation"):
    """Groups and plots security weights by sector."""
    # Get security weights from the Result object (defaults to first strategy: 'Portfolio')
    weights = res.get_security_weights()
    
    # Map tickers to sectors
    # Create a mapping dictionary: {ticker: sector}
    sector_map = {t: metadata.get(t, {}).get('sector', 'Other') for t in weights.columns}
    
    # Group weights by sector
    sector_weights = weights.T.groupby(sector_map).sum().T
    
    # Clean up column names (sectors)
    sector_weights.columns = [str(c) for c in sector_weights.columns]
    
    # Plot as a stacked area chart
    ax = sector_weights.plot(kind='area', stacked=True, figsize=(10, 6), title=title)
    ax.set_ylabel("Weight")
    ax.set_xlabel("Date")
    plt.legend(loc='center left', bbox_to_anchor=(1.0, 0.5))
    plt.tight_layout()

def main():
    # 1. Setup
    logger.info("Initializing Backtester...")
    
    # Use config file from command line argument if provided
    config_path = 'config.yaml'
    if len(sys.argv) > 1:
        config_path = sys.argv[1]
        
    config = load_config(config_path)
    data_engine = DataEngine()
    
    # 2. Filter and Clean Tickers
    raw_universe = config['portfolio'].get('universe', [])
    if isinstance(raw_universe, str):
        raw_universe = raw_universe.split(',')
    
    # Clean tickers: strip whitespace, remove empty, and deduplicate
    portfolio_tickers = sorted(list(set(
        str(t).strip() for t in raw_universe if t and str(t).strip()
    )))
    
    # Filter out exclusions
    exclusions = config['portfolio'].get('exclusions', [])
    portfolio_tickers = [t for t in portfolio_tickers if t not in exclusions]
    
    fixed_weights = config['portfolio'].get('fixed_weights', {})
    
    # Audit Check: Validate Total Fixed Weight
    total_fixed_weight = sum(fixed_weights.values())
    if total_fixed_weight > 1.0:
        logger.error(f"Total fixed weights ({total_fixed_weight:.2%}) exceed 100%.")
        raise ValueError(f"Total fixed weights ({total_fixed_weight:.2%}) exceed 100%. Please adjust config.")
        
    fixed_tickers = list(fixed_weights.keys())
    
    benchmarks = config['settings']['benchmarks']
    all_tickers = list(set(portfolio_tickers + fixed_tickers + benchmarks))
    logger.info(f"Portfolio Universe: {len(portfolio_tickers)} tickers")
    logger.info(f"Fixed Weight Tickers: {fixed_tickers}")
    logger.info(f"Benchmarks: {benchmarks}")
    
    # 3. Fetch Data & Metadata
    logger.info(f"Fetching historical data for {len(all_tickers)} symbols...")
    data = data_engine.get_historical_data(
        tickers=all_tickers,
        start_date=config['settings']['start_date'],
        end_date=config['settings']['end_date']
    )
    logger.info(f"Data fetch complete. Shape: {data.shape}")
    
    # Fetch Metadata (Sectors)
    logger.info("Fetching asset metadata...")
    metadata = data_engine.get_metadata(all_tickers)
    
    # Trim data to the requested range BEFORE dropping problematic tickers
    start = config['settings']['start_date']
    end = config['settings']['end_date']
    
    # Timezone is now handled centrally in DataEngine, but ensure consistency
    if data.index.tz is not None:
        data.index = data.index.tz_localize(None)
        
    data = data[start:end]
    
    # Analyze tickers with missing data (NaNs)
    # Use threshold-based filtering to avoid survivorship bias
    # (e.g., don't drop COIN just because it IPO'd in April 2021)
    max_nan_pct = config['settings'].get('max_nan_pct', 0.5)  # Default: drop if >50% NaN
    total_rows = len(data)
    nan_counts = data.isna().sum()
    nan_pct = nan_counts / total_rows
    
    # Identify tickers with excessive NaNs
    excessive_nan_tickers = nan_pct[nan_pct > max_nan_pct].index.tolist()
    
    if excessive_nan_tickers:
        logger.warning(f"Tickers dropped due to excessive NaNs (>{max_nan_pct:.0%}) in range {start} to {end}:")
        for ticker in excessive_nan_tickers:
            nans = nan_counts[ticker]
            pct = nan_pct[ticker] * 100
            logger.warning(f"  - {ticker}: {nans} NaNs ({pct:.2f}% of {total_rows} rows)")
        data = data.drop(columns=excessive_nan_tickers)
    
    # Forward-fill remaining NaNs (for tickers with acceptable partial history)
    remaining_nans = data.isna().sum()
    if remaining_nans.any():
        logger.info(f"Forward-filling NaNs for tickers with partial history: {remaining_nans[remaining_nans > 0].to_dict()}")
        data = data.ffill()
        # Back-fill any leading NaNs (for tickers that started later than the period)
        data = data.bfill()
    
    # Ensure only tickers actually present in the data are used
    available_tickers = data.columns.tolist()
    portfolio_tickers = [t for t in portfolio_tickers if t in available_tickers]
    
    # Track dropped fixed-weight assets explicitly
    original_fixed_weights = config['portfolio'].get('fixed_weights', {})
    fixed_weights = {t: w for t, w in original_fixed_weights.items() if t in available_tickers}
    dropped_fixed = [t for t in original_fixed_weights if t not in fixed_weights]
    if dropped_fixed:
        logger.warning(f"CRITICAL: Fixed-weight assets DROPPED due to missing data: {dropped_fixed}")
        logger.warning(f"  Original fixed allocation: {sum(original_fixed_weights.values()):.2%}")
        logger.warning(f"  Remaining fixed allocation: {sum(fixed_weights.values()):.2%}")
    
    # Validate and warn about dropped benchmarks
    original_benchmarks = config['settings']['benchmarks']
    benchmarks = [t for t in original_benchmarks if t in available_tickers]
    dropped_benchmarks = [t for t in original_benchmarks if t not in benchmarks]
    if dropped_benchmarks:
        logger.warning(f"Benchmarks dropped due to missing data: {dropped_benchmarks}")
    
    if not benchmarks:
        logger.error("No benchmark data available! Cannot run comparative backtest.")
        raise ValueError("At least one benchmark must have valid data.")
    
    logger.info(f"Updated Portfolio Universe: {len(portfolio_tickers)} tickers")
    logger.info(f"Updated Benchmarks: {benchmarks}")
    logger.info(f"Final Data Columns count: {len(available_tickers)}")
    logger.debug(f"Final Data Columns: {available_tickers}")
    
    # 4. Define Strategies
    logger.info("Defining strategies...")
    
    # Calculate Blended Weights
    total_fixed_weight = sum(fixed_weights.values())
    remaining_weight = 1.0 - total_fixed_weight
    
    # Distribute remaining weight equally among non-fixed portfolio tickers
    other_tickers = [t for t in portfolio_tickers if t not in fixed_weights]
    
    # Validation: ensure we have tickers to allocate remaining weight
    if not other_tickers and remaining_weight > 0.001:
        logger.error(f"No non-fixed tickers available but {remaining_weight:.2%} remains unallocated!")
        raise ValueError("Portfolio allocation incomplete: no tickers to distribute remaining weight.")
    
    dist_weight = remaining_weight / len(other_tickers) if other_tickers else 0
    
    target_weights = {t: dist_weight for t in other_tickers}
    target_weights.update(fixed_weights)
    
    # Validation: ensure we have a valid portfolio
    if not target_weights:
        logger.error("Cannot create portfolio strategy: no valid tickers with weights.")
        raise ValueError("Cannot create portfolio strategy: no valid tickers with weights.")
    
    logger.info(f"Target Weights: {target_weights}")
    
    # Get rebalancing frequency from config (default: quarterly)
    rebalance_freq = config['settings'].get('rebalance_frequency', 'quarterly').lower()
    rebalance_algo_map = {
        'daily': bt.algos.RunDaily(),
        'weekly': bt.algos.RunWeekly(),
        'monthly': bt.algos.RunMonthly(),
        'quarterly': bt.algos.RunQuarterly(),
        'yearly': bt.algos.RunYearly(),
        'once': bt.algos.RunOnce(),
    }
    if rebalance_freq not in rebalance_algo_map:
        logger.warning(f"Unknown rebalance_frequency '{rebalance_freq}', defaulting to quarterly")
        rebalance_freq = 'quarterly'
    rebalance_algo = rebalance_algo_map[rebalance_freq]
    logger.info(f"Rebalancing frequency: {rebalance_freq}")

    # Custom Portfolio Strategy
    s_portfolio = bt.Strategy('Portfolio', [
        rebalance_algo,
        bt.algos.SelectThese(list(target_weights.keys())),
        bt.algos.WeighSpecified(**target_weights),
        bt.algos.Rebalance()
    ])
    
    # Benchmark Strategies
    bench_strategies = []
    for bench in benchmarks:
        s_bench = bt.Strategy(bench, [
            bt.algos.RunOnce(),           # Just buy and hold
            bt.algos.SelectThese([bench]),
            bt.algos.WeighEqually(),
            bt.algos.Rebalance()
        ])
        bench_strategies.append(s_bench)
    
    # 5. Create and Run Backtests
    logger.info("Running backtests...")
    tests = [bt.Backtest(s_portfolio, data)]
    for s in bench_strategies:
        tests.append(bt.Backtest(s, data))
        
    res = bt.run(*tests)
    logger.info("Backtest execution complete.")
    
    # 6. Performance Summary & Plotting
    logger.info("Displaying results...")
    
    # Apply risk-free rate if specified
    rf = config['settings'].get('risk_free_rate', 0.0)
    if rf != 0.0:
        logger.info(f"Setting risk-free rate to {rf:.2%}")
        res.set_riskfree_rate(rf)
        
    res.display()
    res.plot(title="Backtest: Custom Portfolio vs Benchmarks (bt version)")
    plt.xlim(config['settings']['start_date'], config['settings']['end_date'])
    
    # Plot Sectoral Allocation
    logger.info("Plotting sectoral allocation...")
    plot_sectoral_allocation(res, metadata)
    
    plt.show()

if __name__ == "__main__":
    main()
