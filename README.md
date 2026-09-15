# 🚀 [Your Project Title Here]

> ⚠️ **Replace everything in `[ ]` brackets with your actual content before submission.**

---

## 👥 Team

| Field | Value |
|---|---|
| **Team Name** | Team Apex |
| **Track** | AI |
| **Team Lead** | Dhariya - 25ce034@charusat.edu.in |
| **Members** | Priyam, Krisha, Shrushti |

---

## 🎯 Problem Statement

Container ports must continuously coordinate vessels, berths, cranes, and container movement under changing operational conditions. High vessel arrival density, increasing container volumes, limited berth capacity, and crane availability can create congestion, increasing vessel waiting time and reducing port throughput.

Port operations managers need a way to anticipate congestion before it becomes critical and translate predictions into practical operational decisions such as berth reassignment, crane allocation, alternative berth routing, and short-term operational planning.

---

## 💡 Solution

SmartPort AI combines a trained machine-learning congestion predictor with operational decision-support services.

The platform follows the workflow:

Predict → Explain → Optimise → Act

It predicts congestion risk from operational conditions, identifies key operational factors contributing to the risk, produces a 72-hour scenario-based forecast, recommends better berth and crane assignments, evaluates alternative berth routing, supports What-If scenarios, and generates a coordinated 72-hour operational plan.

---

## ✨ Key Features

🤖 AI Congestion Prediction

Predicts port/berth congestion risk using operational features including:
Vessel count
Container volume
Average vessel waiting time
Berth utilisation
The prediction service uses a trained Random Forest classifier and its class probabilities.

🔎 Congestion Explanation

Provides key operational factors associated with the predicted congestion, such as:
High berth utilisation
High vessel waiting time
High container volume
High vessel count

📈 72-Hour Congestion Forecast

Generates an hourly 72-hour operational scenario forecast using the trained congestion model and simulated operational trends.
The forecast provides:
Risk level
Probability
Operational conditions
Key factors

⚓ Berth Optimisation

Evaluates available berths using operational factors such as:
Projected utilisation
Berth capacity
Available crane capacity and recommends a berth that can reduce operational pressure.

🏗️ Crane Optimisation

Recommends an available crane based on:
Berth
Crane availability
Container workload
Crane capacity

🔀 Alternative Berth Routing

Identifies whether moving a vessel toward an alternative operational berth can provide a meaningful reduction in congestion pressure.
This feature represents operational berth routing, not maritime navigation.

🧪 What-If Simulation

Allows operators to explore scenarios such as changing a vessel's arrival time and evaluate the resulting operational conditions and congestion prediction.

📋 72-Hour Operational Plan

Combines forecast, berth optimisation, crane assignment, and routing recommendations into a coordinated action plan for the next 72 hours.

🤖 IBM Bob + MCP Integration

SmartPort AI exposes operational capabilities through an MCP server, allowing IBM Bob to interact with SmartPort AI capabilities including:

Congestion prediction
Berth optimisation
Crane optimisation
What-If simulation
72-hour operational planning

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| **Languages** | [e.g., Python, TypeScript] |
| **Frameworks** | [e.g., FastAPI, React] |
| **IBM Technologies** | [e.g., watsonx.ai, IBM Bob, IBM Cloud] |
| **Databases** | [e.g., PostgreSQL, Redis] |
| **Other** | [e.g., Docker, GitHub Actions] |

---

## 📁 Repository Structure

```
├── src/                  # All source code
├── docs/                 # Written documentation
│   ├── problem-statement.md
│   ├── solution-overview.md
│   ├── architecture.md
│   └── setup-guide.md
├── demo/                 # Demo artifacts
│   ├── screenshots/      # App screenshots
│   └── demo-video-link.txt  # Link to demo video
├── presentation/         # Slide deck
└── submission.yaml       # Structured submission metadata
```

---

## ⚡ How to Run

> **Copy these exact steps from your [`docs/setup-guide.md`](docs/setup-guide.md)**

```bash
# 1. Clone the repo
git clone https://github.com/[your-repo].git
cd [your-repo]

# 2. Install dependencies
[your install command here]

# 3. Configure environment
cp .env.example .env
# Edit .env with your values

# 4. Run the project
[your run command here]
```

---

## 🖥️ Demo

| Artifact | Link |
|---|---|
| 📹 Demo Video | [See demo/demo-video-link.txt](demo/demo-video-link.txt) |
| 🌐 Live Demo | [See demo/live-demo-url.txt](demo/live-demo-url.txt) |
| 🖼️ Screenshots | [See demo/screenshots/](demo/screenshots/) |
| 📊 Presentation | [See presentation/slides.pdf](presentation/) |

---

## ⚠️ Known Limitations

> Be honest — judges appreciate transparency over overclaiming.

- [Limitation 1: e.g., "Authentication is mocked — not production-ready"]
- [Limitation 2: e.g., "Only tested on Chrome"]
- [Limitation 3: e.g., "Feature X is scaffolded but not fully implemented"]

---

## 🏅 What We're Most Proud Of

[Tell the judges what part of your submission is strongest and worth paying close attention to.]

---
