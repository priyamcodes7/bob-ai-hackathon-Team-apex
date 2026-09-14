# Solution Overview

## What We Built

SmartPort AI is an AI-powered decision-support platform for port operations teams. It helps operators identify where congestion is likely to occur, understand the operational factors behind the risk, and decide what action should be taken.

Instead of providing only a congestion prediction, SmartPort AI connects prediction with explanation, berth and crane optimisation, what-if analysis, and a 72-hour operational plan. This gives port operators a single workflow for moving from **prediction to action**.

## How It Works

1. **Operational conditions are provided to the system:** The platform works with operational inputs such as vessel count, container volume, average waiting time, and berth utilisation.

2. **Congestion risk is predicted:** A trained machine-learning model analyses the operational inputs and predicts the congestion level and prediction probability.

3. **The prediction is explained:** SmartPort AI identifies important operational factors contributing to the predicted congestion, such as high berth utilisation, vessel volume, container volume, or waiting time.

4. **Future congestion is forecast:** The system generates a 72-hour congestion forecast to help operators anticipate periods of increasing operational pressure.

5. **Berth and crane resources are optimised:** The optimisation logic evaluates berth utilisation, capacity, and crane availability to recommend a more suitable berth and crane assignment.

6. **Alternative operational routing is considered:** If another berth provides a meaningful operational advantage, the system can recommend moving the vessel to an alternative berth.

7. **What-if scenarios can be evaluated:** Operators can simulate changes in vessel arrival conditions and compare the resulting congestion risk with the original scenario.

8. **A 72-hour action plan is generated:** The prediction, optimisation, crane assignment, and routing results are combined into a time-based operational plan containing recommended actions.

9. **The operator takes action:** The dashboard presents the results in a single interface so the operator can understand the situation and act on the recommendations.

## Architecture Diagram

> See [`architecture.md`](architecture.md) for the detailed architecture and data flow.

```text
                    SmartPort AI
                         │
                         ▼
              ┌─────────────────────┐
              │   React Frontend    │
              │      + Vite         │
              └──────────┬──────────┘
                         │ REST API
                         ▼
              ┌─────────────────────┐
              │   FastAPI Backend   │
              └──────────┬──────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
   ┌────────────┐ ┌──────────────┐ ┌──────────────┐
   │ ML         │ │ Optimisation │ │ Scenario /   │
   │ Prediction │ │ & Resources  │ │ Forecasting  │
   └─────┬──────┘ └──────┬───────┘ └──────┬───────┘
         │               │                │
         └───────────────┼────────────────┘
                         ▼
              ┌─────────────────────┐
              │ Decision Support    │
              │ Results             │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ 72-Hour Operational │
              │       Plan          │
              └─────────────────────┘
```

## Key Design Decisions

| Decision | Rationale |
| --- | --- |
| **Use a trained ML model for congestion prediction** | Congestion prediction is the core intelligence of SmartPort AI. Using a trained model allows the system to generate predictions from operational inputs instead of relying only on fixed rules. |
| **Separate prediction from optimisation** | Predicting congestion and deciding what to do about it are different tasks. Separating these components makes the system easier to test, improve, and extend. |
| **Combine berth and crane optimisation** | Congestion decisions depend on more than berth utilisation. Crane availability also affects how effectively a vessel can be handled, so both resources are considered in the operational decision. |
| **Generate a 72-hour operational plan** | A prediction is more useful when it leads to concrete actions. The plan converts forecasts and optimisation results into time-based operational recommendations. |
| **Include explainability** | Port operators need to understand why congestion is predicted before acting on a recommendation. Showing contributing operational factors makes the system easier to interpret. |
| **Support what-if scenarios** | Operators can explore how changes in vessel arrival conditions may affect congestion, helping them evaluate possible responses before taking action. |
| **Use a modular FastAPI backend** | Separate prediction, forecasting, optimisation, routing, crane, and planning services make the system easier to maintain and extend. |

## IBM Technologies Used

- **IBM Bob:** IBM Bob was used as an AI-powered software development partner during the development of SmartPort AI. It assisted with understanding the codebase, implementing and reviewing application components, debugging, and improving the development workflow.

- **IBM Bob / MCP:** Any external product-level integration through IBM Bob's Model Context Protocol (MCP) is only claimed where it is genuinely implemented and verified in the final project. The project does not use a simulated or fake Bob API.
