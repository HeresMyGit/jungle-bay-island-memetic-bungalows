import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, LineSeries, PriceScaleMode } from 'lightweight-charts';
import { filterDataByRange, formatMarketCap, formatAxisLabel, TIME_RANGES } from '../data/mockData';

export default function Chart({ tokens, selectedRange, onRangeChange }) {
  const [isLogScale, setIsLogScale] = useState(false);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesMapRef = useRef(new Map());
  const tooltipRef = useRef(null);
  const tokensRef = useRef([]);

  const enabledTokens = useMemo(() =>
    tokens.filter(t => t.enabled && t.data && t.data.length > 0),
    [tokens]
  );

  // Keep tokens ref current for tooltip callback
  useEffect(() => {
    tokensRef.current = enabledTokens;
  }, [enabledTokens]);

  // Convert data format from {x: ms, y: value} to {time: seconds, value}
  const convertData = (data) => {
    if (!data || data.length === 0) return [];
    return data
      .map(point => ({
        time: Math.floor(point.x / 1000),
        value: point.y
      }))
      .sort((a, b) => a.time - b.time);
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
      layout: {
        background: { color: 'transparent' },
        textColor: '#737373',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: 18,
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        vertLine: {
          color: '#525252',
          width: 1,
          style: 2,
          labelBackgroundColor: '#262626',
        },
        horzLine: {
          color: '#525252',
          width: 1,
          style: 2,
          labelBackgroundColor: '#262626',
        },
      },
      localization: {
        priceFormatter: formatAxisLabel,
      },
      rightPriceScale: {
        borderVisible: false,
        mode: isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
    });

    chartRef.current = chart;

    // Setup tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current) return;

      if (!param.point || !param.time || param.point.x < 0 || param.point.y < 0) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const tooltipContent = [];
      const date = new Date(param.time * 1000);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      seriesMapRef.current.forEach((series, tokenSymbol) => {
        const data = param.seriesData.get(series);
        if (data && data.value !== undefined) {
          const token = tokensRef.current.find(t => t.symbol === tokenSymbol);
          const color = token?.color || '#fff';
          tooltipContent.push(
            `<div style="display:flex;align-items:center;gap:6px;">
              <span style="width:8px;height:8px;border-radius:50%;background:${color};"></span>
              <span style="color:#737373;">${tokenSymbol}:</span>
              <span style="color:#f5f5f5;">${formatMarketCap(data.value)}</span>
            </div>`
          );
        }
      });

      if (tooltipContent.length > 0) {
        tooltipRef.current.innerHTML = `
          <div style="color:#737373;margin-bottom:4px;font-size:11px;">${dateStr}</div>
          ${tooltipContent.join('')}
        `;
        tooltipRef.current.style.display = 'block';

        const containerRect = chartContainerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        let left = param.point.x + 12;
        let top = param.point.y - 12;

        // Keep tooltip within bounds
        if (left + tooltipRect.width > containerRect.width) {
          left = param.point.x - tooltipRect.width - 12;
        }
        if (top + tooltipRect.height > containerRect.height) {
          top = containerRect.height - tooltipRect.height - 8;
        }
        if (top < 0) top = 8;

        tooltipRef.current.style.left = `${left}px`;
        tooltipRef.current.style.top = `${top}px`;
      }
    });

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesMapRef.current.clear();
    };
  }, []);

  // Update price scale mode when log toggle changes
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      rightPriceScale: {
        mode: isLogScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal,
      },
    });
  }, [isLogScale]);

  // Update series when tokens or range changes
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = chartRef.current;
    const currentSymbols = new Set(enabledTokens.map(t => t.symbol));

    // Remove series for disabled tokens
    seriesMapRef.current.forEach((series, symbol) => {
      if (!currentSymbols.has(symbol)) {
        chart.removeSeries(series);
        seriesMapRef.current.delete(symbol);
      }
    });

    // Add or update series for enabled tokens
    enabledTokens.forEach(token => {
      const filteredData = filterDataByRange(token.data, selectedRange);
      const chartData = convertData(filteredData);

      if (seriesMapRef.current.has(token.symbol)) {
        // Update existing series
        const series = seriesMapRef.current.get(token.symbol);
        series.setData(chartData);
      } else {
        // Create new series
        const series = chart.addSeries(LineSeries, {
          color: token.color,
          lineWidth: 2,
          crosshairMarkerVisible: true,
          crosshairMarkerRadius: 4,
          crosshairMarkerBorderColor: token.color,
          crosshairMarkerBackgroundColor: '#0a0a0a',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        series.setData(chartData);
        seriesMapRef.current.set(token.symbol, series);
      }
    });

    // Fit content after updates
    chart.timeScale().fitContent();
  }, [enabledTokens, selectedRange]);

  return (
    <div className="chart-wrapper">
      <div className="chart-controls">
        <div className="chart-control-group">
          <button
            className={`chart-control-btn ${!isLogScale ? 'active' : ''}`}
            onClick={() => setIsLogScale(false)}
          >
            auto
          </button>
          <button
            className={`chart-control-btn ${isLogScale ? 'active' : ''}`}
            onClick={() => setIsLogScale(true)}
          >
            log
          </button>
        </div>
        <div className="chart-control-group">
          {TIME_RANGES.map(range => (
            <button
              key={range.label}
              className={`chart-control-btn ${selectedRange === range.days ? 'active' : ''}`}
              onClick={() => onRangeChange(range.days)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-container" style={{ position: 'relative' }}>
        <div className="axis-label axis-label-y">Market Cap</div>
        <div className="axis-label axis-label-x">Date</div>
        <div ref={chartContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <div
          ref={tooltipRef}
          style={{
            display: 'none',
            position: 'absolute',
            left: 0,
            top: 0,
            padding: '8px 12px',
            backgroundColor: '#111111',
            border: '1px solid #262626',
            borderRadius: '6px',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 10,
            whiteSpace: 'nowrap',
          }}
        />
        {enabledTokens.length === 0 && (
          <div className="chart-empty-overlay">
            Select at least one token to display
          </div>
        )}
      </div>
    </div>
  );
}
