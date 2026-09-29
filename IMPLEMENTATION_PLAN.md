# Implementation Plan: Express MVC Trading Robot

## Objective
Build a forex and index trading robot using Express.js with MVC separation of concerns. The first version focuses on SMC structure and break-and-retest logic for XAUUSD, US30, NAS100, GER30, and GER40.

## Scope
- Market: Forex and index instruments
- Data source: Deriv market data
- Mode: Backtest first
- Timeframes: 1H, 4H, Daily
- Database: MongoDB-ready
- UI: dashboard

## Architecture
### MVC Layers
- Controllers: HTTP request handling
- Services: data integration and strategy logic
- Routes: API endpoints
- Config: environment and database setup
- Public: dashboard UI
- Models: future Mongo schema layer

## Strategy
- Daily and 4H trend bias
- 1H execution confirmation
- Liquidity sweep detection
- Break of structure detection
- Retest validation
- Strict risk management
- Trade filtering based on trend and invalidation

## Backtest
- Simulate trade entries and exits using historical candles
- Calculate win rate, PnL, profit factor, and drawdown
- Display summary in dashboard

## Phase 1
- Initialize project
- Set up Express
- Add MongoDB config
- Create dashboard and API structure

## Phase 2
- Build Deriv market data adapter
- Normalize candles
- Build SMC service

## Phase 3
- Implement backtest engine
- Add dashboard summary route
- Test strategy on sample candles

## Phase 4
- Tune break-and-retest parameters
- Improve dashboard reports
- Prepare for paper trading
