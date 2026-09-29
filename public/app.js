let chartRefreshTimer = null;

function formatSignalText(signal) {
  if (!signal || !signal.direction || signal.direction === 'none') {
    return 'Signal waiting';
  }

  return `Signal ${signal.direction.toUpperCase()} · ${Number(signal.confidence || 0).toFixed(2)}`;
}

function updateChartMeta(symbol, timeframe, signal, lastPrice) {
  const chartMeta = document.getElementById('chartMeta');
  if (!chartMeta) return;

  const priceText = lastPrice ? `Last ${Number(lastPrice).toFixed(2)}` : 'Last --';

  chartMeta.innerHTML = `
    <span class="price-pill">${symbol} / ${timeframe} · ${priceText}</span>
    <span class="signal-pill">${formatSignalText(signal)}</span>
  `;
}

function renderSignalStatus(signal) {
  const signalBox = document.getElementById('signalStatus');
  if (!signalBox) return;

  if (!signal || !signal.direction || signal.direction === 'none') {
    signalBox.textContent = 'Signal unavailable';
    return;
  }

  signalBox.innerHTML = `
    <strong>Bias:</strong> ${signal.bias}<br>
    <strong>Structure:</strong> ${signal.structure}<br>
    <strong>Direction:</strong> ${signal.direction || 'none'}<br>
    <strong>Confidence:</strong> ${(signal.confidence * 100).toFixed(0)}%
  `;
}

function renderCandlestickSvg(candleData, signal = null) {
  const chartContainer = document.getElementById('pairChart');
  if (!chartContainer) return;

  const width = chartContainer.clientWidth || 860;
  const height = chartContainer.clientHeight || 360;
  const padding = { top: 16, right: 18, bottom: 18, left: 80 };
  const lows = candleData.map((c) => c.low);
  const highs = candleData.map((c) => c.high);
  const minPrice = Math.min(...lows);
  const maxPrice = Math.max(...highs);
  const priceRange = Math.max(maxPrice - minPrice, 0.01);
  const step = (width - padding.left - padding.right) / Math.max(candleData.length - 1, 1);
  const lastPrice = candleData[candleData.length - 1]?.close ?? null;

  const yForPrice = (value) => {
    const chartHeight = height - padding.top - padding.bottom;
    return height - padding.bottom - ((value - minPrice) / priceRange) * chartHeight;
  };

  const candles = candleData.map((candle, index) => {
    const x = padding.left + index * step;
    const openY = yForPrice(candle.open);
    const closeY = yForPrice(candle.close);
    const highY = yForPrice(candle.high);
    const lowY = yForPrice(candle.low);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.max(2, Math.abs(closeY - openY));
    const bodyWidth = Math.max(4, Math.min(14, step * 0.62));
    const color = candle.close >= candle.open ? '#28c76f' : '#ff5d73';

    return `
      <line x1="${x}" y1="${highY}" x2="${x}" y2="${lowY}" stroke="${color}" stroke-width="1.3" stroke-linecap="round" opacity="0.9" />
      <rect x="${x - bodyWidth / 2}" y="${bodyTop}" width="${bodyWidth}" height="${bodyHeight}" fill="${color}" rx="1.3" opacity="0.96" />
    `;
  }).join('');

  const gridLines = Array.from({ length: 6 }, (_, index) => {
    const y = padding.top + (index * (height - padding.top - padding.bottom)) / 5;
    const price = maxPrice - ((maxPrice - minPrice) * index) / 5;
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#34465d" stroke-dasharray="4 6" stroke-width="1" opacity="0.9" />
      <text x="${padding.left - 14}" y="${y + 4}" fill="#9fb3c8" font-size="10" text-anchor="end" font-weight="600">${Number(price).toFixed(2)}</text>
    `;
  }).join('');

  const signalLineMarkup = [];

  if (signal) {
    const directionColor = signal.direction === 'long' ? '#35d07f' : signal.direction === 'short' ? '#ff5d73' : '#7dd3fc';

    if (signal.breakLevel) {
      const breakY = yForPrice(Number(signal.breakLevel));
      signalLineMarkup.push(`
        <line x1="${padding.left}" y1="${breakY}" x2="${width - padding.right}" y2="${breakY}" stroke="${directionColor}" stroke-dasharray="8 7" stroke-width="1.1" opacity="0.9" />
      `);
    }

    if (signal.retestLevel && Number(signal.retestLevel) !== Number(signal.breakLevel ?? 0)) {
      const retestY = yForPrice(Number(signal.retestLevel));
      signalLineMarkup.push(`
        <line x1="${padding.left}" y1="${retestY}" x2="${width - padding.right}" y2="${retestY}" stroke="#fbbf24" stroke-dasharray="6 6" stroke-width="1" opacity="0.8" />
      `);
    }

    if (signal.entryPrice) {
      const entryY = yForPrice(Number(signal.entryPrice));
      signalLineMarkup.push(`
        <line x1="${padding.left}" y1="${entryY}" x2="${width - padding.right}" y2="${entryY}" stroke="#e2e8f0" stroke-dasharray="2 7" stroke-width="1" opacity="0.8" />
      `);
    }

    if (signal.stopLoss) {
      const stopY = yForPrice(Number(signal.stopLoss));
      signalLineMarkup.push(`
        <line x1="${padding.left}" y1="${stopY}" x2="${width - padding.right}" y2="${stopY}" stroke="#fbbf24" stroke-dasharray="2 5" stroke-width="1.1" opacity="0.9" />
      `);
    }

    if (signal.takeProfit) {
      const tpY = yForPrice(Number(signal.takeProfit));
      signalLineMarkup.push(`
        <line x1="${padding.left}" y1="${tpY}" x2="${width - padding.right}" y2="${tpY}" stroke="#93c5fd" stroke-dasharray="2 5" stroke-width="1.1" opacity="0.9" />
      `);
    }
  }

  const lastPriceMarkup = lastPrice
    ? `<text x="${width - 14}" y="${padding.top + 12}" fill="#e2e8f0" font-size="11" font-weight="700" text-anchor="end">LAST ${Number(lastPrice).toFixed(2)}</text>`
    : '';

  chartContainer.innerHTML = `
    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="chartBg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#0a1f35" />
          <stop offset="100%" stop-color="#071827" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#chartBg)" rx="10" />
      ${gridLines}
      ${signalLineMarkup.join('')}
      ${lastPriceMarkup}
      ${candles}
    </svg>
  `;
}

async function fetchSummary() {
  const response = await fetch('/api/dashboard/summary');
  const result = await response.json();

  const stats = document.getElementById('stats');

  if (!result.success) {
    stats.innerHTML = '<div class="stat-card"><h3>Error</h3><div class="value">Failed</div></div>';
    return;
  }

  const data = result.data.market;
  const totalPnL = data.reduce((sum, item) => sum + item.totalPnL, 0);
  const totalTrades = data.reduce((sum, item) => sum + item.totalTrades, 0);

  stats.innerHTML = `
    <div class="stat-card">
      <h3>Total Symbols</h3>
      <div class="value">${result.data.totalSymbols}</div>
    </div>
    <div class="stat-card">
      <h3>Total Trades</h3>
      <div class="value">${totalTrades}</div>
    </div>
    <div class="stat-card">
      <h3>Total PnL</h3>
      <div class="value">${totalPnL.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <h3>Status</h3>
      <div class="value">Live</div>
    </div>
  `;
}

async function fetchMarketOverview() {
  const marketTable = document.getElementById('marketTable');
  const marketSource = document.getElementById('marketSource');

  try {
    const response = await fetch('/api/market/overview');
    const result = await response.json();

    if (!result.success || !Array.isArray(result.data) || !result.data.length) {
      marketTable.innerHTML = '<p>Market feed unavailable.</p>';
      marketSource.textContent = 'Market source: unavailable';
      return;
    }

    const feed = result.data;
    const provider = feed[0]?.provider || 'alpaca';
    marketSource.textContent = `Market source: ${provider.toUpperCase()} live feed`;

    marketTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Last</th>
            <th>Change</th>
            <th>Type</th>
            <th>Provider</th>
          </tr>
        </thead>
        <tbody>
          ${feed.map((item) => `
            <tr>
              <td>${item.symbol}</td>
              <td>${Number(item.lastPrice).toFixed(2)}</td>
              <td>${item.changePercent >= 0 ? '+' : ''}${Number(item.changePercent).toFixed(2)}%</td>
              <td>${item.type}</td>
              <td>${item.provider || 'alpaca'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Market overview fetch failed:', error);
    marketTable.innerHTML = '<p>Market feed unavailable.</p>';
    marketSource.textContent = 'Market source: unavailable';
  }
}

async function fetchSignal() {
  const symbol = document.getElementById('symbolSelect').value;
  const timeframe = document.getElementById('timeframeSelect').value;

  const response = await fetch('/api/signal/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol, timeframe })
  });

  const payload = await response.json();

  if (!payload.success || !payload.data || !payload.data.signal) {
    renderSignalStatus(null);
    return null;
  }

  const signal = payload.data.signal;
  renderSignalStatus(signal);
  return signal;
}

async function fetchSignalForChart(symbol, timeframe) {
  try {
    const response = await fetch('/api/signal/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, timeframe })
    });

    const payload = await response.json();
    if (!payload.success || !payload.data || !payload.data.signal) {
      return null;
    }

    return payload.data.signal;
  } catch (error) {
    console.warn('Signal overlay fetch failed:', error.message);
    return null;
  }
}

async function renderPairChart(symbol = 'XAUUSD', timeframe = '1h') {
  const chartContainer = document.getElementById('pairChart');

  if (!chartContainer) {
    return;
  }

  try {
    const response = await fetch(`/api/market/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&count=120`);
    const payload = await response.json();

    if (!payload.success || !Array.isArray(payload.data) || !payload.data.length) {
      chartContainer.innerHTML = '<p>Chart unavailable.</p>';
      return;
    }

    const candleData = payload.data.map((candle) => ({
      time: Math.floor(new Date(candle.time).getTime() / 1000),
      open: Number(candle.open),
      high: Number(candle.high),
      low: Number(candle.low),
      close: Number(candle.close)
    }));

    const signal = await fetchSignalForChart(symbol, timeframe);
    renderCandlestickSvg(candleData, signal);
    updateChartMeta(symbol, timeframe, signal, candleData[candleData.length - 1]?.close ?? null);

    if (signal) {
      renderSignalStatus(signal);
    } else {
      renderSignalStatus(null);
    }
  } catch (error) {
    console.error('Chart render failed:', error);
    chartContainer.innerHTML = '<p>Chart unavailable.</p>';
  }
}

function startLiveChartPolling() {
  const symbol = document.getElementById('symbolSelect')?.value || 'XAUUSD';
  const timeframe = document.getElementById('timeframeSelect')?.value || '1h';

  renderPairChart(symbol, timeframe);

  if (chartRefreshTimer) {
    clearInterval(chartRefreshTimer);
  }

  chartRefreshTimer = setInterval(() => {
    const currentSymbol = document.getElementById('symbolSelect')?.value || 'XAUUSD';
    const currentTimeframe = document.getElementById('timeframeSelect')?.value || '1h';
    renderPairChart(currentSymbol, currentTimeframe);
  }, 15000);
}

function renderRiskProfile(profile) {
  const container = document.getElementById('riskResult');
  if (!container) return;

  if (!profile) {
    container.innerHTML = '<p>Risk profile unavailable.</p>';
    return;
  }

  const modeLabel = profile.mode === 'aggressive' ? 'Aggressive' : profile.mode === 'strategy' ? 'Strategy' : 'Fixed';
  const pct = (profile.riskPercent * 100).toFixed(0);

  container.innerHTML = `
    <div class="risk-grid">
      <div class="risk-card">
        <span class="risk-label">Mode</span>
        <strong>${modeLabel}</strong>
      </div>
      <div class="risk-card">
        <span class="risk-label">Risk %</span>
        <strong>${pct}%</strong>
      </div>
      <div class="risk-card">
        <span class="risk-label">Risk Amount</span>
        <strong>R${Number(profile.riskAmount).toFixed(2)}</strong>
      </div>
      <div class="risk-card">
        <span class="risk-label">Lot Size</span>
        <strong>${Number(profile.lotSize).toFixed(4)}</strong>
      </div>
      <div class="risk-card">
        <span class="risk-label">TP Pips</span>
        <strong>${Number(profile.takeProfitPips).toFixed(0)}</strong>
      </div>
      <div class="risk-card">
        <span class="risk-label">Balance After SL</span>
        <strong>R${Number(profile.balanceAfterStopLoss).toFixed(2)}</strong>
      </div>
    </div>
  `;
}

async function evaluateRiskEngine() {
  const payload = {
    balance: Number(document.getElementById('riskBalance').value || 0),
    estimatedPips: Number(document.getElementById('riskEstimatedPips').value || 0),
    stopLossPips: Number(document.getElementById('riskStopLossPips').value || 0),
    pipValuePerLot: Number(document.getElementById('riskPipValue').value || 170),
    mode: document.getElementById('riskMode').value || 'auto'
  };

  const response = await fetch('/api/risk/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  renderRiskProfile(result?.data || null);
}

document.getElementById('refreshBtn').addEventListener('click', () => {
  fetchSummary();
  fetchMarketOverview();
  fetchSignal();
  startLiveChartPolling();
});

document.getElementById('riskEvaluateBtn').addEventListener('click', evaluateRiskEngine);

document.getElementById('symbolSelect').addEventListener('change', () => {
  fetchSignal();
  startLiveChartPolling();
});

document.getElementById('timeframeSelect').addEventListener('change', () => {
  fetchSignal();
  startLiveChartPolling();
});

document.getElementById('backtestBtn').addEventListener('click', async () => {
  const symbol = document.getElementById('symbolSelect').value;
  const timeframe = document.getElementById('timeframeSelect').value;

  const result = await fetch('/api/backtest/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ symbol, timeframe, days: 30 })
  });

  const payload = await result.json();
  const container = document.getElementById('backtestResult');

  if (!payload.success) {
    container.innerHTML = `<p>Error: ${payload.message}</p>`;
    return;
  }

  const metrics = payload.data.metrics;

  container.innerHTML = `
    <h3>${payload.data.symbol} ${payload.data.timeframe} Backtest</h3>
    <p>Total Trades: ${metrics.totalTrades}</p>
    <p>Win Rate: ${metrics.winRate}%</p>
    <p>Total PnL: ${metrics.totalPnL}</p>
    <p>Profit Factor: ${metrics.profitFactor}</p>
    <p>Max Drawdown: ${metrics.maxDrawdown}</p>
  `;
});

fetchSummary();
fetchMarketOverview();
fetchSignal();
startLiveChartPolling();
evaluateRiskEngine();
