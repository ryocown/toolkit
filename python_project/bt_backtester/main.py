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


def main():
    # 1. Setup
    logger.info("Initializing Multi-Portfolio Backtester...")
    
    # Use config files from command line arguments
    config_paths = sys.argv[1:] if len(sys.argv) > 1 else ['config.yaml']
    
    all_configs = []
    for path in config_paths:
        try:
            cfg = load_config(path)
            # Store filename (without extension) for strategy naming
            cfg['_name'] = os.path.splitext(os.path.basename(path))[0]
            all_configs.append(cfg)
        except Exception as e:
            logger.error(f"Failed to load config {path}: {e}")
            
    if not all_configs:
        logger.error("No valid configurations loaded. Exiting.")
        return

    # Use first config for global settings
    base_config = all_configs[0]
    start_date = base_config['settings']['start_date']
    end_date = base_config['settings']['end_date']
    rf = base_config['settings'].get('risk_free_rate', 0.0)
    
    # Aggregate all benchmarks and tickers across all configs
    aggregated_benchmarks = set()
    aggregated_tickers = set()
    
    for cfg in all_configs:
        aggregated_benchmarks.update(cfg['settings'].get('benchmarks', []))
        
        # Portfolio tickers (can be list or dict)
        raw_univ = cfg['portfolio'].get('universe', [])
        exclusions = set(cfg['portfolio'].get('exclusions', []))
        
        if isinstance(raw_univ, dict):
            for sector_tickers in raw_univ.values():
                aggregated_tickers.update([str(t).strip() for t in sector_tickers if str(t).strip() not in exclusions])
        elif isinstance(raw_univ, str):
            aggregated_tickers.update([str(t).strip() for t in raw_univ.split(',') if str(t).strip() not in exclusions])
        else:
            aggregated_tickers.update([str(t).strip() for t in raw_univ if str(t).strip() not in exclusions])
        
        # Fixed weight tickers
        fixed = cfg['portfolio'].get('fixed_weights', {})
        aggregated_tickers.update(fixed.keys())

    all_tickers = sorted(list(aggregated_tickers | aggregated_benchmarks))
    
    data_engine = DataEngine()
    
    # 3. Fetch Data & Metadata
    logger.info(f"Fetching historical data for {len(all_tickers)} symbols...")
    data = data_engine.get_historical_data(
        tickers=all_tickers,
        start_date=start_date,
        end_date=end_date
    )
    
    # Metadata (Sectors)
    logger.info("Fetching asset metadata...")
    metadata = data_engine.get_metadata(all_tickers)
    
    # Pre-process Data
    if data.index.tz is not None:
        data.index = data.index.tz_localize(None)
    data = data[start_date:end_date]
    
    # NaN Filtering
    max_nan_pct = base_config['settings'].get('max_nan_pct', 0.5)
    nan_pct = data.isna().sum() / len(data)
    excessive_nan_tickers = nan_pct[nan_pct > max_nan_pct].index.tolist()
    
    if excessive_nan_tickers:
        logger.warning(f"Dropping tickers with >{max_nan_pct:.0%} NaNs: {excessive_nan_tickers}")
        data = data.drop(columns=excessive_nan_tickers)
    
    data = data.ffill().bfill()
    available_tickers = set(data.columns)
    
    # 4. Define Strategies
    logger.info("Defining strategies...")
    backtests = []
    
    # Create a strategy for each portfolio config
    for cfg in all_configs:
        portfolio_name = cfg['_name']
        
        # Universe and Fixed Weights for THIS config
        raw_univ = cfg['portfolio'].get('universe', [])
        exclusions = set(cfg['portfolio'].get('exclusions', []))
        
        # Custom Sector Mapping for THIS strategy
        custom_sector_map = {}
        portfolio_tickers = []
        
        if isinstance(raw_univ, dict):
            for sector, tickers in raw_univ.items():
                for t in tickers:
                    ticker = str(t).strip()
                    if ticker in available_tickers and ticker not in exclusions:
                        custom_sector_map[ticker] = sector
                        portfolio_tickers.append(ticker)
        else:
            # Handle list case
            if isinstance(raw_univ, str):
                raw_univ = raw_univ.split(',')
            for t in raw_univ:
                ticker = str(t).strip()
                if ticker in available_tickers and ticker not in exclusions:
                    portfolio_tickers.append(ticker)

        fixed_weights = {t: w for t, w in cfg['portfolio'].get('fixed_weights', {}).items() if t in available_tickers}
        sector_weights_cfg = cfg['portfolio'].get('sector_weights', {})
        
        # Group remaining tickers by sector (using CUSTOM map first, then metadata)
        sector_to_tickers = {}
        for t in portfolio_tickers:
            if t in fixed_weights: continue
            
            sec = custom_sector_map.get(t) or metadata.get(t, {}).get('sector', 'Other')
            if sec not in sector_to_tickers:
                sector_to_tickers[sec] = []
            sector_to_tickers[sec].append(t)
            
        target_weights = fixed_weights.copy()
        remaining_weight = 1.0 - sum(fixed_weights.values())
        
        # Allocate by sector
        allocated_to_sectors = 0.0
        weighted_sectors = []
        for sector, weight in sector_weights_cfg.items():
            if sector in sector_to_tickers:
                tickers = sector_to_tickers[sector]
                actual_weight = min(weight, max(0, remaining_weight - allocated_to_sectors))
                if actual_weight <= 0:
                    continue
                
                dist_weight = actual_weight / len(tickers)
                for t in tickers:
                    target_weights[t] = dist_weight
                allocated_to_sectors += actual_weight
                weighted_sectors.append(sector)
            else:
                logger.warning(f"[{portfolio_name}] Sector '{sector}' not found in portfolio universe.")
                
        # Allocate remaining balance to tickers in un-weighted sectors
        remaining_after_sectors = max(0, remaining_weight - allocated_to_sectors)
        unweighted_tickers = [t for s, ts in sector_to_tickers.items() if s not in weighted_sectors for t in ts]
        
        if unweighted_tickers and remaining_after_sectors > 0.001:
            dist_weight = remaining_after_sectors / len(unweighted_tickers)
            for t in unweighted_tickers:
                target_weights[t] = dist_weight
            
        if not target_weights:
            logger.warning(f"[{portfolio_name}] No valid tickers. Skipping.")
            continue
            
        logger.info(f"[{portfolio_name}] Universe: {len(target_weights)} tickers")
        cfg['_custom_sector_map'] = custom_sector_map # Store for plotting
        
        rebalance_freq = cfg['settings'].get('rebalance_frequency', 'quarterly').lower()
        rebalance_algo_map = {
            'daily': bt.algos.RunDaily(), 'weekly': bt.algos.RunWeekly(),
            'monthly': bt.algos.RunMonthly(), 'quarterly': bt.algos.RunQuarterly(),
            'yearly': bt.algos.RunYearly(), 'once': bt.algos.RunOnce(),
        }
        rebalance_algo = rebalance_algo_map.get(rebalance_freq, bt.algos.RunQuarterly())
        
        s = bt.Strategy(portfolio_name, [
            rebalance_algo,
            bt.algos.SelectThese(list(target_weights.keys())),
            bt.algos.WeighSpecified(**target_weights),
            bt.algos.Rebalance()
        ])
        backtests.append(bt.Backtest(s, data))
    
    # Create benchmark strategies (unique across all configs)
    valid_benchmarks = [b for b in aggregated_benchmarks if b in available_tickers]
    for bench in valid_benchmarks:
        s_bench = bt.Strategy(bench, [
            bt.algos.RunOnce(),
            bt.algos.SelectThese([bench]),
            bt.algos.WeighEqually(),
            bt.algos.Rebalance()
        ])
        backtests.append(bt.Backtest(s_bench, data))
        
    if not backtests:
        logger.error("No valid backtests to run.")
        return
        
    # 5. Run and Display
    logger.info(f"Running {len(backtests)} backtests...")
    res = bt.run(*backtests)
    
    if rf != 0.0:
        res.set_riskfree_rate(rf)
        
    res.display()
    res.plot(title="Backtest: Multiple Portfolios vs Benchmarks")
    plt.xlim(start_date, end_date)
    
    # Sectoral plots for each portfolio (one by one)
    for cfg in all_configs:
        name = cfg['_name']
        if name not in res.prices.columns: continue
        
        logger.info(f"Plotting sectoral allocation for {name}...")
        try:
            plot_sectoral_allocation_with_name(
                res, 
                metadata, 
                strategy_name=name, 
                custom_sector_map=cfg.get('_custom_sector_map')
            )
        except Exception as e:
            logger.error(f"Failed to plot sectoral allocation for {name}: {e}")
            
    plt.show()

def plot_sectoral_allocation_with_name(res, metadata, strategy_name, custom_sector_map=None):
    """Groups and plots security weights by sector for a specific strategy."""
    weights = res.get_security_weights(strategy_name)
    
    sector_map = {}
    for t in weights.columns:
        # Prioritize custom sector map from config
        sec = (custom_sector_map.get(t) if custom_sector_map else None) or metadata.get(t, {}).get('sector', 'Other')
        sector_map[t] = sec
        
    sector_weights = weights.T.groupby(sector_map).sum().T
    sector_weights.columns = [str(c) for c in sector_weights.columns]
    
    ax = sector_weights.plot(kind='area', stacked=True, figsize=(10, 6), title=f"Sectoral Allocation: {strategy_name}")
    ax.set_ylabel("Weight")
    ax.set_xlabel("Date")
    plt.legend(loc='center left', bbox_to_anchor=(1.0, 0.5))
    plt.tight_layout()

if __name__ == "__main__":
    main()
