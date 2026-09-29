/**
 * ComponentGuard AI - SIH26170 (ISRO)
 * Dynamic Anomaly Detection & Predictive Drift Intelligence
 *
 * Architecture:
 * - Deterministic Burn-In Screening Dataset (MIL-STD-883K standard intervals)
 * - Dynamic Peer Isolation & Deviation Analytics
 * - 168h Trend Extrapolation (Linear Rate Extrapolator)
 * - Transparent AI Decision-Support Formulation
 * - Canvas Charting with High-DPI Scaling & Tooltip Handlers
 */

(function () {
  'use strict';

  /* ========================================================
     1. SPECIFICATIONS & CONFIGURATION
     ======================================================== */
  const PARAM_SPECS = {
    leakage: {
      name: 'Leakage Current',
      unit: 'µA',
      datasheetLimit: 50.0,
      safeThreshold: 35.0,
      lotBaseline: 10.0,
      toleranceRange: [8.5, 12.0]
    },
    iddq: {
      name: 'Standby Current (Iddq)',
      unit: 'mA',
      datasheetLimit: 15.0,
      safeThreshold: 8.5,
      lotBaseline: 2.4,
      toleranceRange: [2.1, 2.8]
    },
    prop_delay: {
      name: 'Propagation Delay',
      unit: 'ns',
      datasheetLimit: 8.0,
      safeThreshold: 5.5,
      lotBaseline: 3.2,
      toleranceRange: [2.9, 3.5]
    },
    voh: {
      name: 'Output Voltage (Voh)',
      unit: 'V',
      datasheetLimit: 4.2, // Min limit
      safeThreshold: 4.5,
      lotBaseline: 4.85,
      toleranceRange: [4.75, 4.95]
    }
  };

  /* ========================================================
     2. DETERMINISTIC BURN-IN DATASET
     ======================================================== */
  const DEFAULT_DATASET = [
    // CG-001 (Lot A01) - Normal Nominal Component
    { id: 'CG-001', lot: 'LOT-A01', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'leakage', value: 10.2, status: 'Normal' },
    { id: 'CG-001', lot: 'LOT-A01', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'leakage', value: 11.4, status: 'Normal' },
    { id: 'CG-001', lot: 'LOT-A01', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'leakage', value: 12.1, status: 'Normal' },
    { id: 'CG-001', lot: 'LOT-A01', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'leakage', value: 13.0, status: 'Normal' },

    // CG-002 (Lot A01) - Peer Anomaly (45µA < 50µA datasheet limit, but +350% above lot baseline 10µA)
    { id: 'CG-002', lot: 'LOT-A01', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'leakage', value: 42.0, status: 'Warning' },
    { id: 'CG-002', lot: 'LOT-A01', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'leakage', value: 44.5, status: 'Warning' },
    { id: 'CG-002', lot: 'LOT-A01', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'leakage', value: 45.0, status: 'Anomalous' },
    { id: 'CG-002', lot: 'LOT-A01', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'leakage', value: 46.1, status: 'Anomalous' },

    // CG-003 (Lot A01) - High Drift Component (Starts nominal 10µA, rapid drift: 10 -> 18 -> 29 -> 42.5µA > 35µA safe threshold)
    { id: 'CG-003', lot: 'LOT-A01', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'leakage', value: 10.0, status: 'Normal' },
    { id: 'CG-003', lot: 'LOT-A01', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'leakage', value: 18.0, status: 'Normal' },
    { id: 'CG-003', lot: 'LOT-A01', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'leakage', value: 29.0, status: 'Warning' },
    { id: 'CG-003', lot: 'LOT-A01', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'leakage', value: 42.5, status: 'Warning' },

    // CG-004 (Lot B02) - Combined Anomaly + High Drift (Elevated baseline + steep thermal drift)
    { id: 'CG-004', lot: 'LOT-B02', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'leakage', value: 35.0, status: 'Warning' },
    { id: 'CG-004', lot: 'LOT-B02', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'leakage', value: 41.2, status: 'Warning' },
    { id: 'CG-004', lot: 'LOT-B02', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'leakage', value: 48.5, status: 'Anomalous' },
    { id: 'CG-004', lot: 'LOT-B02', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'leakage', value: 54.2, status: 'Anomalous' },

    // CG-005 (Lot B02) - Normal Reference Die
    { id: 'CG-005', lot: 'LOT-B02', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'leakage', value: 9.8, status: 'Normal' },
    { id: 'CG-005', lot: 'LOT-B02', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'leakage', value: 10.5, status: 'Normal' },
    { id: 'CG-005', lot: 'LOT-B02', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'leakage', value: 11.2, status: 'Normal' },
    { id: 'CG-005', lot: 'LOT-B02', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'leakage', value: 11.9, status: 'Normal' },

    // Additional Parameters for CG-002 (Iddq, Propagation Delay, Voh) to allow parameter switching
    { id: 'CG-002', lot: 'LOT-A01', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'iddq', value: 8.2, status: 'Warning' },
    { id: 'CG-002', lot: 'LOT-A01', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'iddq', value: 9.1, status: 'Warning' },
    { id: 'CG-002', lot: 'LOT-A01', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'iddq', value: 11.4, status: 'Anomalous' },
    { id: 'CG-002', lot: 'LOT-A01', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'iddq', value: 12.8, status: 'Anomalous' },

    { id: 'CG-001', lot: 'LOT-A01', time: '0h', hours: 0, temp: '25°C', volt: '5.0V', param: 'iddq', value: 2.3, status: 'Normal' },
    { id: 'CG-001', lot: 'LOT-A01', time: '24h', hours: 24, temp: '125°C', volt: '5.0V', param: 'iddq', value: 2.4, status: 'Normal' },
    { id: 'CG-001', lot: 'LOT-A01', time: '96h', hours: 96, temp: '125°C', volt: '5.0V', param: 'iddq', value: 2.5, status: 'Normal' },
    { id: 'CG-001', lot: 'LOT-A01', time: '168h', hours: 168, temp: '125°C', volt: '5.0V', param: 'iddq', value: 2.6, status: 'Normal' }
  ];

  /* ========================================================
     3. APPLICATION STATE
     ======================================================== */
  const state = {
    dataset: JSON.parse(JSON.stringify(DEFAULT_DATASET)),
    selectedComponent: 'CG-002',
    selectedParam: 'leakage',
    currentScenario: 'scenario_peer_anomaly',
    analysisRunning: false,
    analysisCompleted: true,
    lastAnalysisTime: new Date(),
    auditLogs: [
      {
        timestamp: '2026-09-29 15:40',
        component: 'CG-001',
        lot: 'LOT-A01',
        risk: 'Low',
        action: 'ACCEPTED',
        reason: 'Within nominal 10 µA peer distribution envelope',
        engineer: 'QA_ENG_ISRO'
      }
    ],
    // Analysis Cache
    activeAnalysis: null
  };

  /* ========================================================
     4. DOM ELEMENTS
     ======================================================== */
  const DOM = {
    // Controls
    scenarioSelector: document.getElementById('scenarioSelector'),
    componentSelector: document.getElementById('componentSelector'),
    paramSelector: document.getElementById('paramSelector'),
    runAnalysisBtn: document.getElementById('runAnalysisBtn'),
    csvFileInput: document.getElementById('csvFileInput'),
    loadSampleBtn: document.getElementById('loadSampleBtn'),
    resetDemoBtn: document.getElementById('resetDemoBtn'),

    // Workflow
    workflowStatusText: document.getElementById('pipelineStatusMessage'),
    stepNodes: [
      document.getElementById('stepNode1'),
      document.getElementById('stepNode2'),
      document.getElementById('stepNode3'),
      document.getElementById('stepNode4'),
      document.getElementById('stepNode5'),
      document.getElementById('stepNode6')
    ],
    connectors: [
      document.getElementById('connector1'),
      document.getElementById('connector2'),
      document.getElementById('connector3'),
      document.getElementById('connector4'),
      document.getElementById('connector5')
    ],

    // Nav Tabs & Sections
    navTabs: document.querySelectorAll('.nav-tab'),
    sections: document.querySelectorAll('.dashboard-section'),

    // Section 1 - Overview
    overviewFocusId: document.getElementById('overviewFocusId'),
    overviewFocusLot: document.getElementById('overviewFocusLot'),
    overviewFocusStatus: document.getElementById('overviewFocusStatus'),
    kpiTotalVal: document.getElementById('kpiTotalVal'),
    kpiNormalVal: document.getElementById('kpiNormalVal'),
    kpiRiskVal: document.getElementById('kpiRiskVal'),
    kpiAnomalyVal: document.getElementById('kpiAnomalyVal'),
    monitorLastAnalysis: document.getElementById('monitorLastAnalysis'),

    // Section 2 - Burn-In Table
    burninTableBody: document.getElementById('burninTableBody'),
    tableSearchInput: document.getElementById('tableSearchInput'),
    tableFilterStatus: document.getElementById('tableFilterStatus'),
    recordCountBadge: document.getElementById('recordCountBadge'),

    // Section 3 - Anomaly Detection
    anomalyChartCanvas: document.getElementById('anomalyChartCanvas'),
    anomalyTooltip: document.getElementById('anomalyTooltip'),
    anomalyYAxisLabel: document.getElementById('anomalyYAxisLabel'),
    legendLotVal: document.getElementById('legendLotVal'),
    legendCompId: document.getElementById('legendCompId'),
    legendCompVal: document.getElementById('legendCompVal'),
    legendSpecVal: document.getElementById('legendSpecVal'),
    gaugeProgressCircle: document.getElementById('gaugeProgressCircle'),
    gaugeScoreNumber: document.getElementById('gaugeScoreNumber'),
    gaugeVerdictLabel: document.getElementById('gaugeVerdictLabel'),
    wfLimitVal: document.getElementById('wfLimitVal'),
    wfObservedVal: document.getElementById('wfObservedVal'),
    wfLotAvgVal: document.getElementById('wfLotAvgVal'),
    wfPeerDevVal: document.getElementById('wfPeerDevVal'),
    wfRiskBadge: document.getElementById('wfRiskBadge'),
    wfMessageText: document.getElementById('wfMessageText'),

    // Section 4 - Predictive Drift
    driftChartCanvas: document.getElementById('driftChartCanvas'),
    driftTooltip: document.getElementById('driftTooltip'),
    driftCurrentTrend: document.getElementById('driftCurrentTrend'),
    driftPredicted168Val: document.getElementById('driftPredicted168Val'),
    driftSafeThresholdVal: document.getElementById('driftSafeThresholdVal'),
    driftRiskClassification: document.getElementById('driftRiskClassification'),

    // Section 5 - AI Risk Explanation
    factor1Badge: document.getElementById('factor1Badge'),
    factor1Text: document.getElementById('factor1Text'),
    fib1: document.getElementById('fib1'),
    factor2Badge: document.getElementById('factor2Badge'),
    factor2Text: document.getElementById('factor2Text'),
    fib2: document.getElementById('fib2'),
    factor3Badge: document.getElementById('factor3Badge'),
    factor3Text: document.getElementById('factor3Text'),
    fib3: document.getElementById('fib3'),
    factor4Text: document.getElementById('factor4Text'),
    fib4: document.getElementById('fib4'),
    rrbRiskBadge: document.getElementById('rrbRiskBadge'),
    rrbCompTarget: document.getElementById('rrbCompTarget'),
    rrbRecText: document.getElementById('rrbRecText'),
    riskRecBox: document.getElementById('riskRecBox'),

    // Section 6 - QA Decision Station
    qaTargetComp: document.getElementById('qaTargetComp'),
    qaTargetRisk: document.getElementById('qaTargetRisk'),
    qaTargetReason: document.getElementById('qaTargetReason'),
    btnQaAccept: document.getElementById('btnQaAccept'),
    btnQaReview: document.getElementById('btnQaReview'),
    btnQaRetest: document.getElementById('btnQaRetest'),
    btnQaReject: document.getElementById('btnQaReject'),
    decisionResultBanner: document.getElementById('decisionResultBanner'),
    drbIcon: document.getElementById('drbIcon'),
    drbHeading: document.getElementById('drbHeading'),
    drbDetail: document.getElementById('drbDetail'),
    drbMeta: document.getElementById('drbMeta'),
    qaAuditTableBody: document.getElementById('qaAuditTableBody'),
    auditCountBadge: document.getElementById('auditCountBadge')
  };

  /* ========================================================
     5. STATISTICAL & ALGORITHMIC FUNCTIONS
     ======================================================== */

  /**
   * Calculates the lot average baseline for a given parameter and time point.
   */
  function calculateLotAverage(lot, param, time) {
    const matching = state.dataset.filter(r => r.lot === lot && r.param === param && r.time === time);
    if (!matching.length) {
      // Fallback to configured lot baseline
      return PARAM_SPECS[param] ? PARAM_SPECS[param].lotBaseline : 10.0;
    }
    const sum = matching.reduce((acc, cur) => acc + cur.value, 0);
    return parseFloat((sum / matching.length).toFixed(2));
  }

  /**
   * Computes percentage deviation of component from lot baseline.
   */
  function calculatePeerDeviation(value, lotAvg) {
    if (!lotAvg || lotAvg === 0) return 0;
    const diff = value - lotAvg;
    return parseFloat(((diff / lotAvg) * 100).toFixed(1));
  }

  /**
   * Prototype anomaly score (0–100 heuristic index).
   * Formula: bounded ratio of peer deviation + acceleration.
   */
  function calculateAnomalyScore(value, lotAvg, datasheetLimit) {
    if (!lotAvg) return 0;
    const peerDeviationRatio = Math.abs(value - lotAvg) / lotAvg;
    // Normalized score: 350% deviation gives ~87
    let score = Math.round(peerDeviationRatio * 24.8);
    // Boundary check
    if (score < 5) score = 8;
    if (score > 98) score = 98;
    return score;
  }

  /**
   * Extrapolates future 168h value from historical points (0h, 24h, 96h)
   * using deterministic rate extrapolation.
   */
  function predictFutureValue(historyPoints) {
    if (!historyPoints || historyPoints.length < 2) return 0;

    // Linear regression on available hours
    const n = historyPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    historyPoints.forEach(p => {
      sumX += p.hours;
      sumY += p.value;
      sumXY += p.hours * p.value;
      sumXX += p.hours * p.hours;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predicted168 = slope * 168 + intercept;
    return {
      predictedVal: parseFloat(predicted168.toFixed(2)),
      slope: parseFloat(slope.toFixed(4)),
      trend: slope > 0.05 ? 'Increasing' : slope < -0.05 ? 'Decreasing' : 'Stable'
    };
  }

  /**
   * Evaluates drift risk relative to safety threshold.
   */
  function calculateDriftRisk(predictedVal, threshold) {
    if (predictedVal >= threshold) {
      return {
        level: 'HIGH',
        text: 'HIGH RISK (Crosses Safe Drift Threshold)',
        badge: 'HIGH RISK',
        isCrossed: true
      };
    } else if (predictedVal >= threshold * 0.8) {
      return {
        level: 'WARNING',
        text: 'MODERATE (Approaching Boundary)',
        badge: 'WARNING',
        isCrossed: false
      };
    }
    return {
      level: 'NORMAL',
      text: 'NOMINAL (Well Below Boundary)',
      badge: 'NOMINAL',
      isCrossed: false
    };
  }

  /* ========================================================
     6. CORE ANALYSIS ENGINE
     ======================================================== */
  function executeAnalysis(componentId, paramKey) {
    const spec = PARAM_SPECS[paramKey] || PARAM_SPECS.leakage;

    // Filter component records
    const compRecords = state.dataset.filter(r => r.id === componentId && r.param === paramKey);
    const componentLot = compRecords.length ? compRecords[0].lot : 'LOT-A01';

    // Build timeline points (0h, 24h, 96h, 168h)
    const timeLabels = ['0h', '24h', '96h', '168h'];
    const timelineData = timeLabels.map(t => {
      const match = compRecords.find(r => r.time === t);
      const hours = parseInt(t.replace('h', ''), 10);
      const lotAvg = calculateLotAverage(componentLot, paramKey, t);

      let val = match ? match.value : spec.lotBaseline;
      return {
        time: t,
        hours: hours,
        value: val,
        lotAvg: lotAvg,
        datasheetLimit: spec.datasheetLimit
      };
    });

    // 96h and 168h values
    const observed96 = timelineData.find(d => d.time === '96h') || timelineData[2];
    const observed168 = timelineData.find(d => d.time === '168h') || timelineData[3];

    // Peer baseline calculation at 96h
    const lotAvg96 = observed96.lotAvg;
    const peerDev = calculatePeerDeviation(observed96.value, lotAvg96);
    const anomalyScore = calculateAnomalyScore(observed96.value, lotAvg96, spec.datasheetLimit);

    // Predict 168h using 0h, 24h, and 96h measurements
    const historicalPoints = timelineData.slice(0, 3);
    const driftPrediction = predictFutureValue(historicalPoints);
    const driftRisk = calculateDriftRisk(driftPrediction.predictedVal, spec.safeThreshold);

    // Combined Risk Logic
    let overallRisk = 'LOW';
    let recommendation = 'Component behavior conforms to lot baseline. Recommended for flight qualification.';

    if (anomalyScore >= 70 || driftRisk.level === 'HIGH') {
      overallRisk = 'HIGH';
      recommendation = 'Keep component under review and perform further electrical investigation.';
    } else if (anomalyScore >= 40 || driftRisk.level === 'WARNING') {
      overallRisk = 'MEDIUM';
      recommendation = 'Flag for extended screening burn-in and monitor parametric drift rate.';
    }

    const analysisResult = {
      componentId,
      lot: componentLot,
      param: paramKey,
      spec,
      timelineData,
      observedVal: observed96.value,
      lotAvg: lotAvg96,
      peerDev: peerDev,
      anomalyScore: anomalyScore,
      driftPrediction: driftPrediction,
      driftRisk: driftRisk,
      overallRisk: overallRisk,
      recommendation: recommendation,
      timestamp: new Date()
    };

    state.activeAnalysis = analysisResult;
    return analysisResult;
  }

  /* ========================================================
     7. RENDERING: CHARTS (CANVAS WITH HIGH DPI)
     ======================================================== */

  /**
   * Helper to initialize canvas for crisp retina rendering.
   */
  function setupCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Set internal resolution
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx, width: rect.width, height: rect.height };
  }

  /**
   * Renders the Dynamic Anomaly Detection Chart (Canvas).
   * Compares Lot Baseline vs Selected Component vs Datasheet Limit.
   */
  function renderAnomalyChart(analysis) {
    const canvas = DOM.anomalyChartCanvas;
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 30;
    const padBottom = 45;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const data = analysis.timelineData;
    const spec = analysis.spec;

    // Y scale range
    const maxVal = Math.max(spec.datasheetLimit * 1.08, ...data.map(d => d.value * 1.15));
    const minVal = 0;

    const getX = (idx) => padLeft + (idx / (data.length - 1)) * plotW;
    const getY = (val) => padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // 1. Draw Grid Lines
    ctx.strokeStyle = 'rgba(79, 172, 254, 0.08)';
    ctx.lineWidth = 1;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = minVal + (i / yTicks) * maxVal;
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      // Y-axis label
      ctx.fillStyle = '#6d84ad';
      ctx.font = '10px "SF Mono", Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), padLeft - 8, y + 3);
    }

    // X-axis ticks & labels
    data.forEach((d, idx) => {
      const x = getX(idx);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(79, 172, 254, 0.12)';
      ctx.moveTo(x, padTop);
      ctx.lineTo(x, height - padBottom);
      ctx.stroke();

      ctx.fillStyle = '#8fa0c4';
      ctx.font = '11px "SF Mono", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.time, x, height - padBottom + 18);
    });

    // 2. Datasheet Limit Line (Dashed Amber)
    const limitY = getY(spec.datasheetLimit);
    ctx.save();
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, limitY);
    ctx.lineTo(width - padRight, limitY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffb300';
    ctx.font = '10px "SF Mono", Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Datasheet Limit: ${spec.datasheetLimit} ${spec.unit}`, width - padRight, limitY - 6);

    // 3. Lot Average Shaded Peer Envelope & Line (Blue)
    ctx.save();
    ctx.beginPath();
    data.forEach((d, idx) => {
      const x = getX(idx);
      const yUpper = getY(d.lotAvg * 1.15);
      if (idx === 0) ctx.moveTo(x, yUpper);
      else ctx.lineTo(x, yUpper);
    });
    for (let idx = data.length - 1; idx >= 0; idx--) {
      const x = getX(idx);
      const yLower = getY(data[idx].lotAvg * 0.85);
      ctx.lineTo(x, yLower);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(79, 172, 254, 0.08)';
    ctx.fill();

    // Lot Average Line
    ctx.beginPath();
    ctx.strokeStyle = '#4facfe';
    ctx.lineWidth = 2.5;
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.lotAvg);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();

    // Draw Lot dots
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.lotAvg);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#4facfe';
      ctx.fill();
    });

    // 4. Component Line (Crimson/Orange if anomalous, Green if normal)
    const isHighRisk = analysis.overallRisk === 'HIGH';
    const compColor = isHighRisk ? '#ff3366' : analysis.overallRisk === 'MEDIUM' ? '#ffb300' : '#00e676';

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = compColor;
    ctx.lineWidth = 3.5;
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.value);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Glowing points for component
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.value);

      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = isHighRisk ? 'rgba(255, 51, 102, 0.3)' : 'rgba(0, 230, 118, 0.25)';
      ctx.fill();

      // Core point
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = compColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    ctx.restore();

    // Attach points metadata for interactive tooltip hover
    canvas._chartPoints = data.map((d, idx) => ({
      x: getX(idx),
      y: getY(d.value),
      time: d.time,
      value: d.value,
      lotAvg: d.lotAvg,
      unit: spec.unit
    }));
  }

  /**
   * Renders the Predictive Drift Analysis Chart (Canvas).
   * Displays 0h, 24h, 96h historical measurements (solid),
   * vertical prediction marker, and dashed projected line to 168h.
   */
  function renderDriftChart(analysis) {
    const canvas = DOM.driftChartCanvas;
    if (!canvas) return;
    const { ctx, width, height } = setupCanvas(canvas);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 60;
    const padRight = 40;
    const padTop = 30;
    const padBottom = 45;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const data = analysis.timelineData;
    const spec = analysis.spec;
    const predVal = analysis.driftPrediction.predictedVal;

    // Y scale range
    const maxVal = Math.max(spec.safeThreshold * 1.25, predVal * 1.2, 50.0);
    const minVal = 0;

    const getX = (idx) => padLeft + (idx / (data.length - 1)) * plotW;
    const getY = (val) => padTop + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;

    // 1. Safe Drift Threshold Warning Zone & Line
    const threshY = getY(spec.safeThreshold);

    // Shaded threshold breach zone
    ctx.fillStyle = 'rgba(255, 51, 102, 0.06)';
    ctx.fillRect(padLeft, padTop, plotW, threshY - padTop);

    // Safe threshold line
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, threshY);
    ctx.lineTo(width - padRight, threshY);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffb300';
    ctx.font = '10px "SF Mono", Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Safe Drift Threshold: ${spec.safeThreshold} ${spec.unit}`, width - padRight, threshY - 6);

    // 2. Grid lines
    ctx.strokeStyle = 'rgba(79, 172, 254, 0.08)';
    ctx.lineWidth = 1;
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const val = minVal + (i / yTicks) * maxVal;
      const y = getY(val);
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#6d84ad';
      ctx.font = '10px "SF Mono", Consolas, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(val.toFixed(0), padLeft - 8, y + 3);
    }

    // X-axis points & vertical marker
    data.forEach((d, idx) => {
      const x = getX(idx);
      ctx.fillStyle = '#8fa0c4';
      ctx.font = '11px "SF Mono", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(d.time + (idx === 3 ? ' (Predicted)' : ''), x, height - padBottom + 18);
    });

    // 3. Vertical "Prediction Point" marker at 96h (index 2)
    const cutX = getX(2);
    ctx.save();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cutX, padTop);
    ctx.lineTo(cutX, height - padBottom);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#00f5d4';
    ctx.font = '10px "SF Mono", Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Prediction Point (96h)', cutX, padTop - 8);

    // 4. Historical Solid Cyan Line (0h -> 24h -> 96h)
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 3.5;
    for (let i = 0; i <= 2; i++) {
      const x = getX(i);
      const y = getY(data[i].value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Data points for historical
    for (let i = 0; i <= 2; i++) {
      const x = getX(i);
      const y = getY(data[i].value);
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 245, 212, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
    ctx.restore();

    // 5. Predicted Dashed Line (96h -> 168h)
    const p96X = getX(2);
    const p96Y = getY(data[2].value);
    const p168X = getX(3);
    const p168Y = getY(predVal);

    const isHighDrift = predVal >= spec.safeThreshold;
    const predColor = isHighDrift ? '#ff3366' : '#4facfe';

    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = predColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(p96X, p96Y);
    ctx.lineTo(p168X, p168Y);
    ctx.stroke();
    ctx.restore();

    // Predicted Target Point (168h)
    ctx.save();
    ctx.beginPath();
    ctx.arc(p168X, p168Y, 10, 0, Math.PI * 2);
    ctx.fillStyle = isHighDrift ? 'rgba(255, 51, 102, 0.35)' : 'rgba(79, 172, 254, 0.3)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p168X, p168Y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = predColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Predicted Callout Tag
    ctx.fillStyle = predColor;
    ctx.font = 'bold 11px "SF Mono", Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${predVal} ${spec.unit}`, p168X - 40, p168Y - 14);
    ctx.restore();

    // Tooltip cache
    canvas._chartPoints = [
      { x: getX(0), y: getY(data[0].value), label: '0h Historical', val: `${data[0].value} ${spec.unit}` },
      { x: getX(1), y: getY(data[1].value), label: '24h Historical', val: `${data[1].value} ${spec.unit}` },
      { x: getX(2), y: getY(data[2].value), label: '96h Cutoff Point', val: `${data[2].value} ${spec.unit}` },
      { x: p168X, y: p168Y, label: '168h Extrapolated', val: `${predVal} ${spec.unit}` }
    ];
  }

  /**
   * Updates circular SVG gauge based on Anomaly Score.
   */
  function updateGauge(score) {
    const circle = DOM.gaugeProgressCircle;
    const numEl = DOM.gaugeScoreNumber;
    const labelEl = DOM.gaugeVerdictLabel;

    if (!circle || !numEl) return;

    // Circumference = 2 * PI * 78 ≈ 490.09
    const circumference = 490.09;
    const clampedScore = Math.min(100, Math.max(0, score));
    const offset = circumference - (clampedScore / 100) * circumference;

    circle.style.strokeDashoffset = offset;
    numEl.textContent = clampedScore;

    // Determine color & label
    if (clampedScore >= 70) {
      circle.style.stroke = 'var(--status-danger)';
      numEl.style.color = 'var(--status-danger)';
      labelEl.style.color = 'var(--status-danger)';
      labelEl.textContent = 'HIGH ANOMALY';
    } else if (clampedScore >= 40) {
      circle.style.stroke = 'var(--status-warning)';
      numEl.style.color = 'var(--status-warning)';
      labelEl.style.color = 'var(--status-warning)';
      labelEl.textContent = 'WARNING ELEVATION';
    } else {
      circle.style.stroke = 'var(--status-normal)';
      numEl.style.color = 'var(--status-normal)';
      labelEl.style.color = 'var(--status-normal)';
      labelEl.textContent = 'NOMINAL BEHAVIOUR';
    }
  }

  /* ========================================================
     8. UI UPDATES & EXPLANATION SYNTHESIS
     ======================================================== */
  function updateUIWithAnalysis(analysis) {
    const spec = analysis.spec;

    // Section 1 - Overview focus card
    if (DOM.overviewFocusId) DOM.overviewFocusId.textContent = analysis.componentId;
    if (DOM.overviewFocusLot) DOM.overviewFocusLot.textContent = `Lot: ${analysis.lot} • Param: ${spec.name}`;
    if (DOM.overviewFocusStatus) {
      DOM.overviewFocusStatus.textContent = analysis.overallRisk === 'HIGH' ? 'ANOMALOUS DRIFT FLAGGED' : analysis.overallRisk === 'MEDIUM' ? 'WARNING WATCH' : 'NOMINAL LOT MATCH';
      DOM.overviewFocusStatus.className = `focus-status-tag ${analysis.overallRisk === 'HIGH' ? 'font-danger' : analysis.overallRisk === 'MEDIUM' ? 'font-warning' : 'font-normal'}`;
    }

    // Section 3 - Legends and "Why Was This Flagged" Card
    if (DOM.legendLotVal) DOM.legendLotVal.textContent = `${analysis.lotAvg} ${spec.unit}`;
    if (DOM.legendCompId) DOM.legendCompId.textContent = analysis.componentId;
    if (DOM.legendCompVal) DOM.legendCompVal.textContent = `${analysis.observedVal} ${spec.unit}`;
    if (DOM.legendSpecVal) DOM.legendSpecVal.textContent = `${spec.datasheetLimit} ${spec.unit}`;

    if (DOM.wfLimitVal) DOM.wfLimitVal.textContent = `${spec.datasheetLimit} ${spec.unit}`;
    if (DOM.wfObservedVal) DOM.wfObservedVal.textContent = `${analysis.observedVal} ${spec.unit}`;
    if (DOM.wfLotAvgVal) DOM.wfLotAvgVal.textContent = `${analysis.lotAvg} ${spec.unit}`;
    if (DOM.wfPeerDevVal) {
      const sign = analysis.peerDev >= 0 ? '+' : '';
      DOM.wfPeerDevVal.textContent = `${sign}${analysis.peerDev}%`;
    }

    if (DOM.wfRiskBadge) {
      DOM.wfRiskBadge.textContent = analysis.overallRisk;
      DOM.wfRiskBadge.className = `risk-badge-flag ${analysis.overallRisk === 'HIGH' ? 'high' : analysis.overallRisk === 'MEDIUM' ? 'warning' : 'normal'}`;
    }

    if (DOM.wfMessageText) {
      DOM.wfMessageText.textContent = `“Value (${analysis.observedVal} ${spec.unit}) remains below the absolute datasheet limit (${spec.datasheetLimit} ${spec.unit}) but is significantly higher than the lot baseline (${analysis.lotAvg} ${spec.unit}).”`;
    }

    // Gauge
    updateGauge(analysis.anomalyScore);

    // Section 4 - Drift metrics
    if (DOM.driftCurrentTrend) DOM.driftCurrentTrend.textContent = analysis.driftPrediction.trend;
    if (DOM.driftPredicted168Val) DOM.driftPredicted168Val.textContent = `${analysis.driftPrediction.predictedVal} ${spec.unit}`;
    if (DOM.driftSafeThresholdVal) DOM.driftSafeThresholdVal.textContent = `${spec.safeThreshold} ${spec.unit}`;
    if (DOM.driftRiskClassification) {
      DOM.driftRiskClassification.textContent = analysis.driftRisk.badge;
      DOM.driftRiskClassification.className = `dstat-val ${analysis.driftRisk.level === 'HIGH' ? 'font-danger' : analysis.driftRisk.level === 'WARNING' ? 'font-warning' : 'font-normal'}`;
    }

    // Section 5 - AI Risk Explanation Factor Cards
    // Factor 1: Peer Deviation
    if (DOM.factor1Badge) {
      DOM.factor1Badge.textContent = Math.abs(analysis.peerDev) > 100 ? 'CRITICAL SHIFT' : Math.abs(analysis.peerDev) > 30 ? 'ELEVATED' : 'NOMINAL';
      DOM.factor1Badge.className = `factor-badge ${Math.abs(analysis.peerDev) > 100 ? '' : Math.abs(analysis.peerDev) > 30 ? 'warning' : 'success'}`;
    }
    if (DOM.factor1Text) {
      const devStr = analysis.peerDev >= 0 ? `+${analysis.peerDev}%` : `${analysis.peerDev}%`;
      DOM.factor1Text.textContent = `Component deviates ${devStr} relative to the ${analysis.lotAvg} ${spec.unit} lot baseline.`;
    }
    if (DOM.fib1) DOM.fib1.style.width = `${Math.min(100, Math.max(10, analysis.anomalyScore))}%`;

    // Factor 2: Drift Rate
    if (DOM.factor2Badge) {
      const isSteep = analysis.driftPrediction.slope > 0.1;
      DOM.factor2Badge.textContent = isSteep ? 'ACCELERATING' : 'STABLE SLOPE';
      DOM.factor2Badge.className = `factor-badge ${isSteep ? '' : 'success'}`;
    }
    if (DOM.factor2Text) {
      DOM.factor2Text.textContent = `Parametric trajectory is ${analysis.driftPrediction.trend.toLowerCase()} across 0h, 24h, and 96h burn-in stress intervals.`;
    }
    if (DOM.fib2) DOM.fib2.style.width = analysis.driftPrediction.slope > 0.1 ? '78%' : '25%';

    // Factor 3: Future Risk
    if (DOM.factor3Badge) {
      DOM.factor3Badge.textContent = analysis.driftRisk.badge;
      DOM.factor3Badge.className = `factor-badge ${analysis.driftRisk.level === 'HIGH' ? '' : 'success'}`;
    }
    if (DOM.factor3Text) {
      DOM.factor3Text.textContent = analysis.driftRisk.isCrossed
        ? `Predicted 168h value (${analysis.driftPrediction.predictedVal} ${spec.unit}) crosses the configured safe drift threshold (${spec.safeThreshold} ${spec.unit}).`
        : `Predicted 168h value (${analysis.driftPrediction.predictedVal} ${spec.unit}) maintains safe margin under threshold (${spec.safeThreshold} ${spec.unit}).`;
    }
    if (DOM.fib3) DOM.fib3.style.width = analysis.driftRisk.isCrossed ? '92%' : '30%';

    // Factor 4: Confidence
    const confidencePct = 91;
    if (DOM.factor4Text) {
      DOM.factor4Text.innerHTML = `Prototype analysis confidence: <strong>${confidencePct}%</strong> based on 4-interval telemetry convergence.`;
    }
    if (DOM.fib4) DOM.fib4.style.width = `${confidencePct}%`;

    // Overall Risk Box
    if (DOM.rrbRiskBadge) {
      DOM.rrbRiskBadge.textContent = `${analysis.overallRisk} RISK`;
      DOM.rrbRiskBadge.className = `rrb-risk-badge ${analysis.overallRisk === 'HIGH' ? 'high' : analysis.overallRisk === 'MEDIUM' ? 'warning' : 'normal'}`;
    }
    if (DOM.rrbCompTarget) {
      DOM.rrbCompTarget.textContent = `Target: ${analysis.componentId} (${analysis.lot})`;
    }
    if (DOM.rrbRecText) {
      DOM.rrbRecText.textContent = `“${analysis.recommendation}”`;
    }
    if (DOM.riskRecBox) {
      DOM.riskRecBox.className = `risk-recommendation-box ${analysis.overallRisk === 'NORMAL' ? 'normal-state' : ''}`;
    }

    // Section 6 - QA Decision Panel Context
    if (DOM.qaTargetComp) DOM.qaTargetComp.textContent = `${analysis.componentId} (${analysis.lot})`;
    if (DOM.qaTargetRisk) {
      DOM.qaTargetRisk.textContent = analysis.overallRisk;
      DOM.qaTargetRisk.className = `qa-ctx-val ${analysis.overallRisk === 'HIGH' ? 'font-danger' : analysis.overallRisk === 'MEDIUM' ? 'font-warning' : 'font-normal'}`;
    }
    if (DOM.qaTargetReason) {
      DOM.qaTargetReason.textContent = analysis.overallRisk === 'HIGH'
        ? 'High peer deviation + increasing drift + predicted threshold crossing'
        : analysis.overallRisk === 'MEDIUM'
        ? 'Moderate peer deviation under evaluation'
        : 'Nominal lot tracking within tolerance envelope';
    }

    // Render Canvas Charts
    renderAnomalyChart(analysis);
    renderDriftChart(analysis);

    // Refresh Table Active Row
    highlightActiveTableRow(analysis.componentId);

    // Update Last Analysis readout
    if (DOM.monitorLastAnalysis) {
      DOM.monitorLastAnalysis.textContent = 'Just now';
    }
  }

  /**
   * Renders the interactive Burn-In Data table rows.
   */
  function populateDataTable() {
    if (!DOM.burninTableBody) return;

    const searchTerm = (DOM.tableSearchInput ? DOM.tableSearchInput.value : '').toLowerCase();
    const statusFilter = DOM.tableFilterStatus ? DOM.tableFilterStatus.value : 'ALL';

    const filtered = state.dataset.filter(row => {
      const matchSearch = row.id.toLowerCase().includes(searchTerm) || row.lot.toLowerCase().includes(searchTerm);
      const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;
      return matchSearch && matchStatus;
    });

    DOM.burninTableBody.innerHTML = '';

    filtered.forEach(row => {
      const tr = document.createElement('tr');
      if (row.id === state.selectedComponent) {
        tr.classList.add('active-row');
      }

      const spec = PARAM_SPECS[row.param] || PARAM_SPECS.leakage;
      const lotAvg = calculateLotAverage(row.lot, row.param, row.time);
      const statusClass = row.status === 'Normal' ? 'normal' : row.status === 'Warning' ? 'warning' : 'anomalous';

      tr.innerHTML = `
        <td><strong>${row.id}</strong></td>
        <td>${row.lot}</td>
        <td>${row.time}</td>
        <td>${row.temp}</td>
        <td>${row.volt}</td>
        <td>${spec.name}</td>
        <td><strong>${row.value} ${spec.unit}</strong></td>
        <td>${spec.datasheetLimit} ${spec.unit}</td>
        <td>${lotAvg} ${spec.unit}</td>
        <td><span class="badge-status-dot ${statusClass}"></span>${row.status}</td>
        <td><button class="table-action-btn" data-comp="${row.id}">Inspect</button></td>
      `;

      // Click to inspect
      tr.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
          focusComponent(row.id);
        }
      });

      const btn = tr.querySelector('.table-action-btn');
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          focusComponent(row.id);
        });
      }

      DOM.burninTableBody.appendChild(tr);
    });

    if (DOM.recordCountBadge) {
      DOM.recordCountBadge.textContent = `${filtered.length} records shown (${state.dataset.length} total)`;
    }
  }

  function highlightActiveTableRow(compId) {
    if (!DOM.burninTableBody) return;
    const rows = DOM.burninTableBody.querySelectorAll('tr');
    rows.forEach(r => {
      const firstCell = r.querySelector('td strong');
      if (firstCell && firstCell.textContent === compId) {
        r.classList.add('active-row');
      } else {
        r.classList.remove('active-row');
      }
    });
  }

  /* ========================================================
     9. WORKFLOW STEPPER SEQUENCE (RUN ANALYSIS PIPELINE)
     ======================================================== */
  function triggerSequentialAnalysis() {
    if (state.analysisRunning) return;
    state.analysisRunning = true;

    // Reset step styles
    DOM.stepNodes.forEach(node => node.classList.remove('active', 'complete'));
    DOM.connectors.forEach(conn => conn.classList.remove('lit'));

    const sequence = [
      { step: 1, text: '01/06 Processing burn-in telemetry data...' },
      { step: 2, text: '02/06 Validating data integrity & datasheet limits...' },
      { step: 3, text: '03/06 Checking dynamic peer deviation & lot baseline...' },
      { step: 4, text: '04/06 Estimating 168h future drift trajectory...' },
      { step: 5, text: '05/06 Generating explainable risk vectors & confidence...' },
      { step: 6, text: '06/06 Analysis complete. Handing over to QA Decision station.' }
    ];

    let currentIdx = 0;

    function advanceStep() {
      if (currentIdx > 0) {
        // Complete previous
        DOM.stepNodes[currentIdx - 1].classList.remove('active');
        DOM.stepNodes[currentIdx - 1].classList.add('complete');
        if (DOM.connectors[currentIdx - 1]) {
          DOM.connectors[currentIdx - 1].classList.add('lit');
        }
      }

      if (currentIdx < sequence.length) {
        const item = sequence[currentIdx];
        DOM.stepNodes[currentIdx].classList.add('active');
        DOM.workflowStatusText.textContent = item.text;
        currentIdx++;
        setTimeout(advanceStep, 260); // Total pipeline runs in ~1.5s
      } else {
        // Finished
        DOM.stepNodes[5].classList.add('complete');
        state.analysisRunning = false;
        state.lastAnalysisTime = new Date();

        // Perform analysis update
        const analysis = executeAnalysis(state.selectedComponent, state.selectedParam);
        updateUIWithAnalysis(analysis);
      }
    }

    advanceStep();
  }

  /* ========================================================
     10. DEMO SCENARIOS PRESETS
     ======================================================== */
  function applyScenario(scenarioKey) {
    state.currentScenario = scenarioKey;

    switch (scenarioKey) {
      case 'scenario_normal':
        state.selectedComponent = 'CG-001';
        state.selectedParam = 'leakage';
        break;

      case 'scenario_peer_anomaly':
        state.selectedComponent = 'CG-002';
        state.selectedParam = 'leakage';
        break;

      case 'scenario_high_drift':
        state.selectedComponent = 'CG-003';
        state.selectedParam = 'leakage';
        break;

      case 'scenario_combined':
        state.selectedComponent = 'CG-004';
        state.selectedParam = 'leakage';
        break;
    }

    if (DOM.componentSelector) DOM.componentSelector.value = state.selectedComponent;
    if (DOM.paramSelector) DOM.paramSelector.value = state.selectedParam;

    triggerSequentialAnalysis();
  }

  function focusComponent(compId) {
    state.selectedComponent = compId;
    if (DOM.componentSelector) DOM.componentSelector.value = compId;
    triggerSequentialAnalysis();
  }

  /* ========================================================
     11. CSV IMPORT VIA FILE READER
     ======================================================== */
  function handleCSVUpload(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);

        if (lines.length < 2) {
          alert('CSV file appears empty or missing rows.');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const idIdx = headers.indexOf('component_id');
        const lotIdx = headers.indexOf('lot');
        const timeIdx = headers.indexOf('time');
        const tempIdx = headers.indexOf('temperature');
        const voltIdx = headers.indexOf('voltage');
        const paramIdx = headers.indexOf('parameter');
        const valIdx = headers.indexOf('value');

        if (idIdx === -1 || valIdx === -1) {
          alert('CSV missing required headers. Expected: component_id, lot, time, temperature, voltage, parameter, value');
          return;
        }

        const importedRows = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length <= valIdx) continue;

          const hoursVal = parseInt((cols[timeIdx] || '0h').replace('h', ''), 10) || 0;
          const numVal = parseFloat(cols[valIdx]);

          importedRows.push({
            id: cols[idIdx],
            lot: cols[lotIdx] || 'LOT-CSV',
            time: cols[timeIdx] || '0h',
            hours: hoursVal,
            temp: cols[tempIdx] || '125°C',
            volt: cols[voltIdx] || '5V',
            param: (cols[paramIdx] || 'leakage').toLowerCase(),
            value: isNaN(numVal) ? 10.0 : numVal,
            status: numVal > 40 ? 'Anomalous' : numVal > 20 ? 'Warning' : 'Normal'
          });
        }

        if (importedRows.length > 0) {
          state.dataset = importedRows;
          populateDataTable();
          // Update component dropdown
          updateComponentDropdownFromData();
          // Analyze first component
          focusComponent(importedRows[0].id);
          alert(`Successfully imported ${importedRows.length} telemetry records from CSV.`);
        }
      } catch (err) {
        console.error(err);
        alert('Error parsing CSV file. Please ensure standard comma-separated format.');
      }
    };

    reader.readAsText(file);
  }

  function updateComponentDropdownFromData() {
    if (!DOM.componentSelector) return;
    const uniqueIds = Array.from(new Set(state.dataset.map(r => r.id)));
    DOM.componentSelector.innerHTML = '';
    uniqueIds.forEach(id => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = id;
      DOM.componentSelector.appendChild(opt);
    });
    if (uniqueIds.length > 0) {
      state.selectedComponent = uniqueIds[0];
      DOM.componentSelector.value = uniqueIds[0];
    }
  }

  /* ========================================================
     12. QA ENGINEER DECISION STATION
     ======================================================== */
  function recordQADecision(actionType) {
    if (!state.activeAnalysis) return;

    const analysis = state.activeAnalysis;
    const now = new Date();
    const timeStr = now.toISOString().slice(0, 16).replace('T', ' ');

    let actionLabel = 'ACCEPTED';
    let cssClass = 'status-accepted';
    let icon = '✓';
    let desc = 'Passed component for flight assembly qualification.';
    let justification = 'Within nominal peer baseline envelope';

    switch (actionType) {
      case 'accept':
        actionLabel = 'ACCEPTED';
        cssClass = 'status-accepted';
        icon = '✓';
        desc = 'Component cleared by QA Engineer for aerospace lot integration.';
        justification = 'Screening criteria satisfied; nominal telemetry';
        break;

      case 'review':
        actionLabel = 'UNDER REVIEW';
        cssClass = 'status-review';
        icon = '👁';
        desc = 'Holding component for extended 48h thermal soak & electrical testing.';
        justification = 'Abnormal peer divergence requires deeper isolation';
        break;

      case 'retest':
        actionLabel = 'RETEST SCHEDULED';
        cssClass = 'status-retest';
        icon = '↺';
        desc = 'Component cycled back to environmental burn-in chamber.';
        justification = 'Drift velocity requires re-verification at 125°C';
        break;

      case 'reject':
        actionLabel = 'REJECTED';
        cssClass = 'status-rejected';
        icon = '✕';
        desc = 'Component quarantined and screened out from aerospace payload.';
        justification = 'Excessive peer deviation and high predicted drift risk';
        break;
    }

    // Display banner
    if (DOM.decisionResultBanner) {
      DOM.decisionResultBanner.className = `decision-result-banner ${cssClass}`;
      if (DOM.drbIcon) DOM.drbIcon.textContent = icon;
      if (DOM.drbHeading) DOM.drbHeading.textContent = `DECISION RECORDED: ${actionLabel}`;
      if (DOM.drbDetail) DOM.drbDetail.textContent = desc;
      if (DOM.drbMeta) DOM.drbMeta.textContent = `Timestamp: ${timeStr} UTC • Operator: QA_LEAD_ISRO_04 • Target: ${analysis.componentId}`;
    }

    // Append to audit trail
    state.auditLogs.unshift({
      timestamp: timeStr,
      component: analysis.componentId,
      lot: analysis.lot,
      risk: analysis.overallRisk,
      action: actionLabel,
      reason: justification,
      engineer: 'QA_LEAD_ISRO'
    });

    renderAuditTable();
  }

  function renderAuditTable() {
    if (!DOM.qaAuditTableBody) return;
    DOM.qaAuditTableBody.innerHTML = '';

    state.auditLogs.slice(0, 8).forEach(log => {
      const tr = document.createElement('tr');
      const actionClass = log.action.includes('ACCEPT') ? 'accept' : log.action.includes('REVIEW') ? 'review' : log.action.includes('RETEST') ? 'retest' : 'reject';
      const riskDot = log.risk === 'HIGH' ? 'anomalous' : log.risk === 'MEDIUM' ? 'warning' : 'normal';

      tr.innerHTML = `
        <td>${log.timestamp}</td>
        <td><strong>${log.component}</strong></td>
        <td>${log.lot}</td>
        <td><span class="badge-status-dot ${riskDot}"></span> ${log.risk}</td>
        <td><span class="badge-audit ${actionClass}">${log.action}</span></td>
        <td>${log.reason}</td>
        <td>${log.engineer}</td>
      `;
      DOM.qaAuditTableBody.appendChild(tr);
    });

    if (DOM.auditCountBadge) {
      DOM.auditCountBadge.textContent = `${state.auditLogs.length} Decisions Logged`;
    }
  }

  /* ========================================================
     13. RESET DEMO
     ======================================================== */
  function resetDemoState() {
    state.dataset = JSON.parse(JSON.stringify(DEFAULT_DATASET));
    state.selectedComponent = 'CG-002';
    state.selectedParam = 'leakage';
    state.currentScenario = 'scenario_peer_anomaly';

    if (DOM.scenarioSelector) DOM.scenarioSelector.value = 'scenario_peer_anomaly';
    if (DOM.componentSelector) DOM.componentSelector.value = 'CG-002';
    if (DOM.paramSelector) DOM.paramSelector.value = 'leakage';
    if (DOM.decisionResultBanner) DOM.decisionResultBanner.className = 'decision-result-banner hidden';

    populateDataTable();
    triggerSequentialAnalysis();
  }

  /* ========================================================
     14. CHART TOOLTIPS INTERACTION
     ======================================================== */
  function setupChartTooltips() {
    // Tooltip for Anomaly Chart
    if (DOM.anomalyChartCanvas && DOM.anomalyTooltip) {
      DOM.anomalyChartCanvas.addEventListener('mousemove', (e) => {
        const rect = DOM.anomalyChartCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const points = DOM.anomalyChartCanvas._chartPoints;
        if (!points) return;

        let closest = null;
        let minDist = 30;

        points.forEach(pt => {
          const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
          if (dist < minDist) {
            minDist = dist;
            closest = pt;
          }
        });

        if (closest) {
          DOM.anomalyTooltip.style.display = 'block';
          DOM.anomalyTooltip.style.left = `${closest.x + 12}px`;
          DOM.anomalyTooltip.style.top = `${closest.y - 30}px`;
          DOM.anomalyTooltip.innerHTML = `
            <strong>Time: ${closest.time}</strong><br>
            Component: <span style="color:#ff3366">${closest.value} ${closest.unit}</span><br>
            Lot Avg: <span style="color:#4facfe">${closest.lotAvg} ${closest.unit}</span>
          `;
        } else {
          DOM.anomalyTooltip.style.display = 'none';
        }
      });

      DOM.anomalyChartCanvas.addEventListener('mouseleave', () => {
        DOM.anomalyTooltip.style.display = 'none';
      });
    }

    // Tooltip for Drift Chart
    if (DOM.driftChartCanvas && DOM.driftTooltip) {
      DOM.driftChartCanvas.addEventListener('mousemove', (e) => {
        const rect = DOM.driftChartCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const points = DOM.driftChartCanvas._chartPoints;
        if (!points) return;

        let closest = null;
        let minDist = 35;

        points.forEach(pt => {
          const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
          if (dist < minDist) {
            minDist = dist;
            closest = pt;
          }
        });

        if (closest) {
          DOM.driftTooltip.style.display = 'block';
          DOM.driftTooltip.style.left = `${closest.x + 12}px`;
          DOM.driftTooltip.style.top = `${closest.y - 30}px`;
          DOM.driftTooltip.innerHTML = `
            <strong>${closest.label}</strong><br>
            Value: <span style="color:#00f5d4">${closest.val}</span>
          `;
        } else {
          DOM.driftTooltip.style.display = 'none';
        }
      });

      DOM.driftChartCanvas.addEventListener('mouseleave', () => {
        DOM.driftTooltip.style.display = 'none';
      });
    }
  }

  /* ========================================================
     15. TAB NAVIGATION & RESIZE HANDLER
     ======================================================== */
  function setupNavigationTabs() {
    DOM.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-target');

        DOM.navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        DOM.sections.forEach(sec => {
          if (sec.id === targetId) {
            sec.classList.add('active-section');
          } else {
            sec.classList.remove('active-section');
          }
        });

        // Re-render canvas charts if switching into their views
        if (state.activeAnalysis) {
          setTimeout(() => {
            renderAnomalyChart(state.activeAnalysis);
            renderDriftChart(state.activeAnalysis);
          }, 40);
        }
      });
    });
  }

  // Window resize debounced redrawing
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (state.activeAnalysis) {
        renderAnomalyChart(state.activeAnalysis);
        renderDriftChart(state.activeAnalysis);
      }
    }, 120);
  });

  /* ========================================================
     16. EVENT LISTENERS INITIALIZATION
     ======================================================== */
  function initializeEventListeners() {
    // Scenario Selector
    if (DOM.scenarioSelector) {
      DOM.scenarioSelector.addEventListener('change', (e) => {
        applyScenario(e.target.value);
      });
    }

    // Component Selector
    if (DOM.componentSelector) {
      DOM.componentSelector.addEventListener('change', (e) => {
        state.selectedComponent = e.target.value;
        triggerSequentialAnalysis();
      });
    }

    // Parameter Selector
    if (DOM.paramSelector) {
      DOM.paramSelector.addEventListener('change', (e) => {
        state.selectedParam = e.target.value;
        triggerSequentialAnalysis();
      });
    }

    // Run Analysis Button
    if (DOM.runAnalysisBtn) {
      DOM.runAnalysisBtn.addEventListener('click', () => {
        triggerSequentialAnalysis();
      });
    }

    // Load Sample Data Button
    if (DOM.loadSampleBtn) {
      DOM.loadSampleBtn.addEventListener('click', () => {
        resetDemoState();
      });
    }

    // Reset Demo Button
    if (DOM.resetDemoBtn) {
      DOM.resetDemoBtn.addEventListener('click', () => {
        resetDemoState();
      });
    }

    // CSV File Input
    if (DOM.csvFileInput) {
      DOM.csvFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleCSVUpload(e.target.files[0]);
        }
      });
    }

    // Table Filters
    if (DOM.tableSearchInput) {
      DOM.tableSearchInput.addEventListener('input', () => {
        populateDataTable();
      });
    }

    if (DOM.tableFilterStatus) {
      DOM.tableFilterStatus.addEventListener('change', () => {
        populateDataTable();
      });
    }

    // QA Decision Buttons
    if (DOM.btnQaAccept) {
      DOM.btnQaAccept.addEventListener('click', () => recordQADecision('accept'));
    }
    if (DOM.btnQaReview) {
      DOM.btnQaReview.addEventListener('click', () => recordQADecision('review'));
    }
    if (DOM.btnQaRetest) {
      DOM.btnQaRetest.addEventListener('click', () => recordQADecision('retest'));
    }
    if (DOM.btnQaReject) {
      DOM.btnQaReject.addEventListener('click', () => recordQADecision('reject'));
    }

    setupNavigationTabs();
    setupChartTooltips();
  }

  /* ========================================================
     17. BOOTSTRAP APPLICATION
     ======================================================== */
  function initApp() {
    populateDataTable();
    renderAuditTable();
    initializeEventListeners();

    // Initial analysis on CG-002 (Scenario: Peer Anomaly)
    const initialAnalysis = executeAnalysis(state.selectedComponent, state.selectedParam);
    updateUIWithAnalysis(initialAnalysis);

    console.log('%cComponentGuard AI Initialized • SIH26170 ISRO', 'color: #00f5d4; font-weight: bold; font-size: 13px;');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
