# AI-Powered Text-Based Game Framework

> A web-based framework that empowers creators to build interactive text-based games with the assistance of AI-driven narrative generation.

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://reactjs.org)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-API-orange.svg)](https://openai.com)

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#overview">Overview</a></li>
    <li>
      <a href="#quick-start">Quick Start</a>
      <ul>
        <li><a href="#docker-setup">Docker Setup</a></li>
        <li><a href="#manual-setup">Manual Setup</a></li>
      </ul>
    </li>
    <li><a href="#how-to-use">How to Use</a></li>
    <li><a href="#troubleshooting">Troubleshooting</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
    <li><a href="#contact--links">Contact & Links</a></li>
  </ol>
</details>

---

<h2 id="overview">📋 Overview</h2>

This framework bridges the gap between traditional text-based game development and modern AI capabilities. Instead of replacing human creativity, it serves as an intelligent assistant that helps creators:

-   Generate opening scenes from story parameters
-   Create branching choices with natural narrative outcomes
-   Continue scenes coherently using AI
-   Test games with an integrated play mode
-   Save & share projects in JSON format

---

<h2 id="quick-start">🚀 Quick Start</h2>

You can run this project in two ways: **Manual Setup** (for development) or **Docker** (for easy deployment).

### 🔑 Prerequisites

-   Python **3.11+**
-   Node.js **18+** and **pnpm** (`npm install -g pnpm`)
-   OpenAI API key

---

<h2 id="docker-setup">🐳 Docker Setup</h2>

1. Copy `.env.example` to `.env` and set your API key.

    ```bash
    cp .env.example .env
    ```

2. Build and run the containers:

    ```bash
    docker compose up --build
    ```

3. Open **http://localhost:8080**
    - Frontend is served by Nginx
    - API is available at `/api/*` proxied to Flask

---

<h2 id="manual-setup">🛠 Manual Setup</h2>

#### 1. Clone the repository

```bash
git clone https://github.com/Vafakos/text-based-ai-framework.git
cd text-based-ai-framework
```

#### 2. Configure environment variables

Copy the example file and set your OpenAI key:

```bash
cp .env.example .env
# Edit .env and add your API key
```

#### 3. Backend setup

**Linux**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Windows (PowerShell)**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

#### 4. Frontend setup

```bash
cd frontend
pnpm install
pnpm run dev
```

---

<h2 id="how-to-use">🎮 How to Use</h2>

1. Define your story setup (title, genre, characters).
2. Generate an opening scene with AI.
3. Add choices and generate outcomes.
4. Branch into new scenes.
5. Test your game in play mode.
6. Save/export to JSON and share.

---

<h2 id="troubleshooting">🐛 Troubleshooting</h2>

### Common Issues

**🔥 OpenAI API Errors:**

-   Verify your API key is correct
-   Check API rate limits and billing
-   Ensure sufficient credits

**🔌 Connection Issues:**

-   Backend not running on port 5000
-   Frontend proxy configuration
-   Firewall blocking connections

**🐳 Docker Issues:**

```bash
# Reset containers
docker compose down -v
docker compose up --build

# View logs
docker compose logs -f
```

**📦 Dependency Issues:**

```bash
# Backend
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall

# Frontend
pnpm install --force
```

---

<h2 id="contributing">🤝 Contributing</h2>

This is an undergraduate thesis project, so I'm not actively seeking contributions. However, feel free to fork this repository and build upon it for your own projects! The code is open source and you're welcome to use it as a foundation for your own text-based game frameworks or similar applications.

<h2 id="acknowledgments">🙏 Acknowledgments</h2>

-   Ionian University Department of Informatics
-   Supervisor: Ioannis Karydis
-   Co-supervisor: Panagiotis Gratsanis

<h2 id="contact--links">📞 Contact & Links</h2>

**Charalampos-Sokratis Vafakos**  
Computer Science Student, Ionian University

-   🔗 **GitHub**: [@Vafakos](https://github.com/Vafakos)
-   📧 **Contact**: [Through GitHub issues](https://github.com/Vafakos/text-based-ai-framework/issues)
-   🎥 **Video Demo**: Coming soon on YouTube

---

_This framework demonstrates how AI can enhance human creativity rather than replace it, offering a practical example of collaborative human-machine content creation in interactive digital narratives._
