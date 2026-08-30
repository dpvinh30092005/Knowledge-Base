#!/bin/bash

echo "===================================="
echo "Starting Food4Fit with Docker"
echo "===================================="
echo

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed!"
    echo "Please install Docker and make sure it's running."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker and try again."
    exit 1
fi

echo "Docker is running!"
echo

echo "Stopping any existing containers..."
docker-compose down

echo
echo "Building and starting containers..."
docker-compose up -d --build

echo
echo "Waiting for services to start..."
sleep 10

echo
echo "===================================="
echo "Checking container status..."
echo "===================================="
docker-compose ps

echo
echo "===================================="
echo "Viewing application logs..."
echo "===================================="
docker-compose logs app --tail=50

echo
echo "===================================="
echo "Application should be available at:"
echo "http://localhost:8080/auth/login"
echo "===================================="
echo
echo "To view logs: docker-compose logs -f app"
echo "To stop: docker-compose down"
echo

