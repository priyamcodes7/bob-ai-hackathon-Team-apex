# Setup Guide

> SmartPort AI — Predict. Explain. Optimise. Act.

This guide explains how to run the SmartPort AI frontend and backend locally from a clean machine.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- [ ] Python 3.10 or newer
- [ ] Node.js 18 or newer
- [ ] npm
- [ ] Git

No database, Docker installation, IBM Cloud account, or external API key is required for the current prototype.

---

## Project Structure

The project contains:

```text
bob-ai-hackathon-Team-apex/
│
├── backend/
│   ├── main.py
│   ├── mcp_server.py
│   ├── requirements.txt
│   ├── models/
│   └── services/
│
├── src/
│   └── frontend/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── vite.config.ts
│
├── docs/
├── demo/
├── presentation/
└── submission.yaml
