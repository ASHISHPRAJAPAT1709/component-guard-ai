# ComponentGuard AI

### Dynamic Anomaly Detection & Predictive Drift Intelligence

ComponentGuard AI is an AI-assisted prototype for detecting abnormal behaviour and predicting parameter drift during electronic component burn-in and screening.

Developed for **Smart India Hackathon 2026**.

---

## 🚀 Problem

High-reliability electronic components are often screened using fixed pass/fail limits.

A component may remain within its absolute datasheet limit but still behave abnormally compared with other components in the same lot.

For example:

- Lot average leakage: **10 µA**
- Component leakage: **45 µA**
- Datasheet maximum: **50 µA**

Although `45 µA < 50 µA`, the component is significantly different from its peers and may require further investigation.

ComponentGuard AI focuses on identifying this type of abnormal behaviour and detecting increasing parameter drift before it becomes a larger screening concern.

---

## 💡 Solution

ComponentGuard AI provides two primary analysis modules:

### 1. Dynamic Anomaly Detection

Compares a component's parameter values with its lot/peer baseline to identify unusual behaviour.

**Example:**

`Lot Average → 10 µA`  
`Component → 45 µA`  
`Peer Deviation → High`  
`Risk → High`

### 2. Predictive Drift Analysis

Uses historical burn-in measurements to estimate future parameter behaviour.

Example:

```text
0h     → 10 µA
24h    → 18 µA
96h    → 29 µA
168h   → 42 µA (Predicted)
