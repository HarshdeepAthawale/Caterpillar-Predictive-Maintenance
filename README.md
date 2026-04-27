# Caterpillar Predictive Maintenance 🏗️

Deep learning system for real-time fault detection and health monitoring of heavy machinery (turbines & excavators) using high-frequency vibration sensor data.

---

## Problem Statement

Caterpillar Inc. requires a predictive maintenance solution that:
- Classifies bearing faults from vibration signals under noisy industrial conditions
- Detects early-stage faults before catastrophic failure
- Operates with high reliability and low latency (< 20ms inference)

## Dataset

**CWRU Bearing Dataset** — Case Western Reserve University  
- Signal: Vibration (accelerometer) at 12kHz / 48kHz  
- Classes: Normal, Inner Race Fault, Outer Race Fault, Ball Fault  
- Fault sizes: 0.007", 0.014", 0.021" (early → severe)

## Model

**CNN-LSTM Hybrid with Attention Mechanism**
- CNN layers extract local frequency-domain features
- Bidirectional LSTM captures temporal fault progression
- Self-attention focuses on anomalous time segments
- Trained with Focal Loss to handle class imbalance

## Project Structure

```
Caterpillar-Predictive-Maintenance/
├── ai/                         # Deep learning pipeline
│   ├── data/                   # Raw & processed data
│   ├── models/                 # Saved model weights
│   ├── notebooks/              # Jupyter notebooks (EDA, training)
│   └── utils/                  # Helper scripts
├── backend/                    # FastAPI server
│   ├── app/
│   │   ├── api/                # Route handlers
│   │   ├── core/               # Config, startup
│   │   └── models/             # DB models
│   └── tests/
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── store/
│   └── public/
└── docker-compose.yml
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | PyTorch, ONNX Runtime, scikit-learn |
| Backend | FastAPI, Redis, PostgreSQL, Celery |
| Frontend | React, TypeScript, Tailwind CSS, Recharts |
| DevOps | Docker Compose |

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Project structure + requirements | ✅ Done |
| 2 | Data preprocessing pipeline | ✅ Done |
| 3 | CNN-LSTM model training | ✅ Done |
| 4 | FastAPI backend + model serving | ✅ Done |
| 5 | React frontend dashboard | ✅ Done |
| 6 | Docker Compose integration | ✅ Done |

## Quick Start

### AI Model
```bash
cd ai
pip install -r requirements.txt
jupyter notebook notebooks/
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Full Stack (Docker)
```bash
cp .env.example .env          # configure credentials
make build                    # build + start all services
# OR
docker compose up -d --build
```

| URL | Service |
|-----|---------|
| http://localhost | React frontend |
| http://localhost:8000 | FastAPI backend |
| http://localhost:8000/docs | Swagger UI |

```bash
make logs        # stream all logs
make down        # stop everything
make clean       # stop + remove volumes
```

## Evaluation Metrics

- Accuracy, Precision, Recall, F1 (weighted + macro)
- Specificity, FPR, FNR, MCC
- Confusion Matrix (raw + normalized)
- Early Detection Rate (fault at 0.007" severity)
- Inference Latency (target < 20ms)
