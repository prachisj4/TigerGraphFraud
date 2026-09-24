# TigerGraphFraud — Hackathon Demo Guide (3–5 Minute Presentation)

This document provides a step-by-step presentation script for demonstrating **TigerGraphFraud** during hackathon judging.

---

## ⏱️ Demo Agenda (3:30 Total)

| Time | Stage | Action |
| :--- | :--- | :--- |
| **0:00 - 0:30** | **The Problem** | Explain why traditional rule engines struggle with graph relationships and complex fraud. |
| **0:30 - 1:00** | **Overview Dashboard** | Showcase real-time system connector status (FastAPI, TigerGraph, Gemini, Datasets). |
| **1:00 - 1:45** | **Live Investigation** | Open Case `HHG-002`, run Autonomous Investigation, view live tool trace. |
| **1:45 - 2:30** | **Graph Intelligence** | Jump to TigerGraph visualization to show shared device/card multi-hop links. |
| **2:30 - 3:00** | **Structured Assessment** | Review final `ESCALATE` recommendation, confidence, and suggested operational action. |
| **3:00 - 3:30** | **Case Comparison** | Select Case `HHG-003` to show dynamic recommendation (`CLEAR`) based on real facts. |

---

## 🎬 Step-by-Step Presentation Script

### 1. Introduction & Problem Statement (0:00 - 0:30)
> *"Hi everyone! Traditional fraud detection systems flag suspicious transactions based on static threshold rules—like high transaction amounts or unusual times. But modern fraud rings operate across synthetic identities, shared device fingerprints, and compromise multiple cards simultaneously. Rules flood analysts with false positives while missing hidden relationships. Today, we're presenting **TigerGraphFraud**—an autonomous fraud investigation platform that combines **Google Gemini Agentic AI** with **TigerGraph Savanna Graph Intelligence**."*

---

### 2. System Status & Overview Dashboard (0:30 - 1:00)
- **Action**: Navigate to `http://localhost:5173` (Overview Page).
- **Key Visual**: Point out the **System Health & Connector Status Banner** at the top.
- **Talking Point**:
> *"Here on our Overview Dashboard, you can see all four core connectors active in real-time: our FastAPI backend, 20-case dataset, Gemini 3.5/3.6 Agent, and live TigerGraph Savanna connection. Our dataset contains 20 real investigation cases with 6 high-risk model alerts, 5 medium-risk alerts, and 9 customer dispute reports."*

---

### 3. Live Autonomous Investigation (1:00 - 1:45)
- **Action**: Click **Cases** on sidebar, select `HHG-002`, and click **Run Investigation**.
- **Key Visual**: The **Autonomous Agent Execution Trace** timeline rendering live steps.
- **Talking Point**:
> *"Let's investigate Case HHG-002. When we click 'Run Investigation', our Gemini Agent receives the case payload and dynamically decides which tools to invoke using native function calling. Notice the observable execution trace: Gemini calls `check_region_history`, `check_device_identity`, and `get_graph_evidence` to inspect the transaction in TigerGraph."*

---

### 4. TigerGraph Savanna Graph Intelligence (1:45 - 2:30)
- **Action**: Click **Graph Intelligence** button on top right of Case HHG-002 workspace.
- **Key Visual**: The multi-colored graph canvas showing Customer, Card, Device, and Transaction nodes.
- **Talking Point**:
> *"By switching to Graph Intelligence, we view real multi-hop entity relationships retrieved directly from TigerGraph Savanna. The customer vertex `C11891` is connected to card `C11891-K1` and shared device profiles. Graph analysis enables analysts to spot fraud rings before cards are drained."*

---

### 5. Final AI Assessment & Case Comparison (2:30 - 3:30)
- **Action**: Return to Investigation workspace to show the Final AI Assessment card. Then select `HHG-003` to demonstrate a `CLEAR` recommendation.
- **Talking Point**:
> *"Finally, Gemini synthesizes all empirical evidence into a structured assessment. For HHG-002, the recommendation is **ESCALATE** with 95% confidence due to unrecognised device fingerprints and out-of-region card-present activity. When we inspect HHG-003, Gemini autonomously evaluates the customer's prior transaction history and returns a **CLEAR** recommendation. Every recommendation is grounded in real tool evidence."*

---

## 🔑 Key Technical Talking Points for Judges

1. **True Native Tool Calling**: We use `google-genai` native function calling (`tools=[...]`) so Gemini autonomously selects tools based on case facts.
2. **Real TigerGraph Savanna Connection**: Data-plane RESTPP connection queries real multi-hop graph edges (`Customer -> Card -> DeviceProfile`).
3. **Trace Safety**: Observable audit logs show tool activity without exposing raw prompt tokens or internal reasoning.
4. **Verified Performance**: 20 out of 20 test cases run cleanly through end-to-end tool execution and structured assessment.
