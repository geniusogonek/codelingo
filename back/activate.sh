#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

FLAG_FILE=".postgres_running"

if [ ! -f "docker-compose.yml" ]; then
    echo "Ошибка: файл docker-compose.yml не найден в $SCRIPT_DIR"
    exit 1
fi

start_db() {
    echo "Запуск PostgreSQL..."
    if sudo docker compose up -d; then
        touch "$FLAG_FILE"
        echo "PostgreSQL запущен! Подключение: localhost:5432, пароль: example"
    else
        echo "Ошибка при запуске PostgreSQL."
        exit 1
    fi
}

stop_db() {
    echo "Остановка PostgreSQL..."
    if sudo docker compose down; then
        rm -f "$FLAG_FILE"
        echo "PostgreSQL остановлен."
    else
        echo "Ошибка при остановке PostgreSQL."
        exit 1
    fi
}

if [ -f "$FLAG_FILE" ]; then
    stop_db
else
    start_db
fi
