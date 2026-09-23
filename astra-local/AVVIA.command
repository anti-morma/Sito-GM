#!/bin/bash
cd "$(dirname "$0")"

echo "========================================"
echo "    Avvio Sito GM su Mac"
echo "========================================"

# Verifica se Node.js è installato
if ! command -v node &> /dev/null; then
    echo ""
    echo "[ERRORE] Node.js non risulta installato su questo Mac."
    echo "Per favore scarica e installa Node.js da: https://nodejs.org"
    echo ""
    read -p "Premi Invio per uscire..."
    exit 1
fi

# Se node_modules manca o proviene da Windows (ha file .cmd/.exe), reinstalliamo per Mac
if [ ! -d "node_modules" ] || [ -f "node_modules/.bin/vite.cmd" ]; then
    echo ""
    echo "Rilevate dipendenze mancanti o create su Windows."
    echo "Installazione dipendenze native per Mac (npm install)..."
    rm -rf node_modules
    npm install
fi

echo ""
echo "Avvio del server..."
echo "Apri nel browser: http://localhost:3000"
echo "========================================"
npm run dev -- -H 127.0.0.1
