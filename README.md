# Tradkings SMC Trading Bot

A lightweight Express MVC trading dashboard and strategy project for forex and index instruments, designed around Smart Money Concepts (SMC) break-and-retest analysis.

## Current project status

This project is currently in a live-data integration stage.

- Mock candle generation has been removed.
- The app now requires a real market data provider to populate chart and signal data.
- If no live provider is configured, the API returns a clear error instead of generating fake candles.
- The project is set up for real market data feeds and strategy analysis, but it is not yet fully connected to a live provider by default.

## What is implemented

- Express.js backend with MVC structure
- Market symbol and overview endpoints
- Candle fetching from a live provider abstraction
- SMC-style signal analysis
- Risk evaluation routes
- Dashboard UI for market overview and chart display
- MongoDB-ready persistence for market signal records
- Backtest execution flow for strategy testing

## Required configuration

Set the required environment variables in `.env` before running the app.

At minimum, you need a market data provider such as:

- Deriv (`DERIV_APP_ID`, `DERIV_API_URL`)
- or Alpaca / Alpha Vantage for quote-based market data

Example keys currently present in the project are placeholders or provider credentials that must be verified before production use.

## Quick start

1. Install dependencies:
   npm install
2. Configure environment variables in `.env`
3. Start the server:
   npm start
4. Open the dashboard in the browser:
   http://localhost:3000

## Main routes

- `GET /api/market/symbols`
- `GET /api/market/overview`
- `GET /api/market/candles`
- `POST /api/signal/analyze`
- `POST /api/risk/evaluate`
- `POST /api/backtest/run`
- `GET /api/dashboard/summary`

## Project structure

- `src/config/` - environment and app config
- `src/controllers/` - request handlers
- `src/routes/` - route registration
- `src/services/` - market, signal, analysis, and backtest logic
- `src/models/` - MongoDB models
- `public/` - frontend assets
- `server.js` - startup entry point

## Important note

This project is not a fully live-trading-ready system yet. It is a working trading dashboard and strategy framework that currently depends on a valid live market data provider to function correctly.
