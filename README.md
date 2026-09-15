# 🚀 SmartPort AI

> **Predict. Explain. Optimise. Act.**

SmartPort AI is an AI-powered port operations decision-support platform designed to help port operations teams anticipate container congestion and take timely operational decisions.

The platform combines machine-learning based congestion prediction with explainable operational factors, berth and crane optimisation, what-if analysis, and a 72-hour operational plan.

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Team Apex |
| **Track** | AI |
| **Problem Statement** | L1 — Container Congestion Predictor & Port Operations Optimiser |
| **Team Lead** | Dhairy — 25ce034@charusat.edu.in |
| **Member** | Priyam — 25it033@charusat.edu.in |
| **Member** | Krisha — 25ce058@charusat.edu.in |
| **Member** | Srushti — 25ce054@charusat.edu.in |

---

## 🎯 Problem Statement

Port operations managers need to continuously balance vessel arrivals, container volumes, berth utilisation, waiting times, and available cranes.

When vessel arrivals and container volumes increase while berth capacity becomes constrained, congestion can build rapidly. This can lead to:

- Longer vessel waiting times
- Inefficient berth utilisation
- Poor crane allocation
- Delays in vessel handling
- Difficulty planning operations several hours in advance

Traditional operational decisions can require manually analysing multiple operational factors at once.

### Our Challenge

The selected problem statement is:

**L1 — Container Congestion Predictor & Port Operations Optimiser**

The solution should help predict container congestion hotspots using vessel schedules and berth capacity, recommend alternate routing, optimise berth/crane assignment, and produce a 72-hour port operations plan.

---

## 💡 Solution

**SmartPort AI** is an AI-powered decision-support platform for port operations.

It follows a simple operational workflow:

> **Predict → Explain → Optimise → Act**

### 1. Predict

The system analyses operational conditions such as:

- Vessel count
- Container count
- Average waiting time
- Berth utilisation

A trained machine-learning model estimates the congestion risk and probability.

### 2. Explain

Instead of showing only a risk label, SmartPort AI identifies the operational conditions contributing to the predicted risk.

For example:

- High berth utilisation
- High vessel count
- High container volume
- High average waiting time

This gives an operations manager context behind the prediction.

### 3. Optimise

When congestion risk is high, the platform evaluates available operational resources and recommends actions such as:

- Alternative berth assignment
- Crane assignment
- Operational adjustments
- Alternative routing

### 4. Act

The system converts the analysis into a **72-hour operational plan**, helping the operations team understand what actions should be prioritised over the upcoming operating period.

---

## ✨ Key Features

### 🚢 Congestion Risk Prediction

Uses a trained **Random Forest machine-learning model** to estimate congestion risk from operational inputs including:

- Vessel count
- Container count
- Average waiting time
- Berth utilisation

The model provides both a congestion risk level and probability.

---

### 📈 72-Hour Congestion Forecast

Generates an hourly congestion forecast for the next **72 hours**.

Each forecast point contains:

- Hour
- Berth
- Congestion risk
- Probability
- Operational conditions
- Contributing factors

This allows operators to anticipate increasing congestion instead of reacting only after congestion occurs.

---

### 🔍 Explainable Congestion Analysis

SmartPort AI does not treat the prediction as a black box.

The platform displays operational factors contributing to the current congestion risk, allowing an operator to understand **why the system considers a situation risky**.

---

### ⚓ Berth Optimisation

The system compares available berths using operational conditions such as:

- Berth utilisation
- Capacity
- Crane availability

It recommends a more suitable berth when the current berth is under higher pressure.

The optimisation output also estimates the potential waiting-time reduction associated with the recommendation.

---

### 🏗️ Crane Optimisation

The system considers available crane resources and operational demand to recommend an appropriate crane assignment.

This helps reduce resource bottlenecks during congested operating conditions.

---

### 🗺️ Alternative Berth Routing

When the selected berth is projected to experience higher congestion, SmartPort AI can recommend an alternative berth to distribute operational pressure.

---

### 🔮 What-If Simulation

Operators can explore alternative operating scenarios and observe how changing vessel arrival conditions can affect the predicted congestion risk.

This supports scenario-based decision making before taking an operational action.

---

### 📋 72-Hour Operational Plan

SmartPort AI converts prediction and optimisation results into a structured operational plan.

The plan provides prioritised actions that can be used by port operations teams to manage expected congestion over the next 72 hours.

---

## 🧠 AI & Decision-Support Architecture

The system combines machine learning with operational decision logic.

```text
                    ┌─────────────────────┐
                    │    Port Operator    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Dashboard   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │     Backend API     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
        ┌──────────────┐ ┌────────────┐ ┌──────────────┐
        │ ML Prediction│ │ Forecast   │ │ Optimisation │
        │ Random Forest│ │ 72 Hours   │ │ Berth/Crane │
        └──────┬───────┘ └─────┬──────┘ └──────┬───────┘
               │               │               │
               └───────────────┼───────────────┘
                               ▼
                    ┌─────────────────────┐
                    │ Operational Plan    │
                    │      72 Hours       │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Predict → Explain   │
                    │ → Optimise → Act    │
                    └─────────────────────┘
