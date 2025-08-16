
---
title: C/No Voidline
emoji: 🎵
colorFrom: green
colorTo: cyan
sdk: static
pinned: false
license: mit
---

# C/No Voidline - AI Audio Mastering Console

A professional-grade AI audio mastering console built with React and Web Audio API.

## Features

- 🎵 Real-time audio analysis with industry-standard metrics (LUFS, dBTP, LRA)
- 🤖 AI-powered mastering with multiple presets
- 📊 Professional visualizers and spectrum analysis
- 🎛️ Manual control rack for fine-tuning
- 💾 Multi-format export capabilities (MP3, FLAC, WAV)
- 🎨 Terminal-inspired UI with multiple themes

## How to Use

1. Upload your audio file using the drop zone
2. Choose an AI mastering preset or use manual controls
3. Monitor the real-time analysis and meters
4. Export your mastered audio

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Audio**: Web Audio API, AudioWorklets
- **UI**: Tailwind CSS, Radix UI, Framer Motion
- **Analysis**: Real-time FFT, LUFS metering, spectrum analysis

## Local Development

To run this project locally:

```bash
git clone https://github.com/yourusername/cno-voidline
cd cno-voidline
npm install
cp configs/huggingface-config.env .env.production
npm run build
npm run preview
```

## Repository

Full source code and documentation: [GitHub Repository](https://github.com/yourusername/cno-voidline)

## License

MIT License - see LICENSE file for details
