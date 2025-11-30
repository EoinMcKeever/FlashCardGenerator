# Docker Setup Guide

This document provides detailed information about running the FlashCard Generator application with Docker.

## Architecture

The application consists of three Docker containers:

1. **PostgreSQL Database** (`db`): Stores user data, decks, and flashcards
2. **FastAPI Backend** (`backend`): REST API server
3. **React Frontend** (`frontend`): User interface

## Quick Commands

### Start the application
```bash
docker-compose up --build
```

Or use the convenience script:
```bash
./start.sh
```

### Start in detached mode (background)
```bash
docker-compose up -d --build
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

### Stop the application
```bash
docker-compose down
```

Or use the convenience script:
```bash
./stop.sh
```

### Stop and remove all data
```bash
docker-compose down -v
```

### Rebuild a specific service
```bash
docker-compose up --build backend
docker-compose up --build frontend
```

### Access container shell
```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# Database
docker-compose exec db psql -U flashcard_user -d flashcard_db
```

## Configuration

### Environment Variables

The `docker-compose.yml` file contains all configuration. Key variables:

#### Database
- `POSTGRES_USER`: Database user (default: `flashcard_user`)
- `POSTGRES_PASSWORD`: Database password (default: `flashcard_password`)
- `POSTGRES_DB`: Database name (default: `flashcard_db`)

#### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key (CHANGE IN PRODUCTION!)
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

### Ports

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Database**: localhost:5432

To change ports, edit the `ports` section in `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # External:Internal
```

### Volumes

Data persistence is handled through Docker volumes:

- `postgres_data`: Database files (persists between restarts)
- `./backend:/app`: Backend code (for hot-reloading)
- `./frontend:/app`: Frontend code (for hot-reloading)

## Development Workflow

### Hot Reloading

Both frontend and backend support hot-reloading:

1. **Backend**: Changes to `.py` files automatically reload the server
2. **Frontend**: Changes to `.jsx` files automatically update in browser

### Database Migrations

To reset the database:

```bash
# Stop containers and remove volumes
docker-compose down -v

# Start fresh
docker-compose up --build
```

The database schema is automatically created when the backend starts.

### Install New Dependencies

#### Backend (Python)
```bash
# Add package to requirements.txt, then:
docker-compose up --build backend
```

#### Frontend (Node)
```bash
# Add package to package.json, then:
docker-compose up --build frontend
```

## Troubleshooting

### Port Already in Use

If you see an error like "port is already allocated":

```bash
# Find what's using the port
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432

# Kill the process or change the port in docker-compose.yml
```

### Database Connection Errors

If the backend can't connect to the database:

1. Check if the database is healthy:
   ```bash
   docker-compose ps
   ```

2. View database logs:
   ```bash
   docker-compose logs db
   ```

3. Ensure the database is ready before backend starts (healthcheck in `docker-compose.yml`)

### Frontend Can't Reach Backend

If API calls fail:

1. Check backend is running:
   ```bash
   docker-compose logs backend
   ```

2. Verify CORS settings in `backend/app/main.py`

3. Ensure API URL is correct in frontend (`http://localhost:8000`)

### Container Won't Start

View logs to diagnose:
```bash
docker-compose logs [service-name]
```

Common issues:
- **Syntax errors**: Check logs for Python/JavaScript errors
- **Missing dependencies**: Rebuild with `--build` flag
- **Port conflicts**: Change ports in `docker-compose.yml`

### Permission Errors (Linux)

If you encounter permission errors with mounted volumes:

```bash
# Option 1: Change ownership
sudo chown -R $USER:$USER .

# Option 2: Run Docker with your user ID
docker-compose down
USER_ID=$(id -u) GROUP_ID=$(id -g) docker-compose up
```

### Clear Everything and Start Fresh

```bash
# Stop all containers
docker-compose down -v

# Remove all images
docker-compose rm -f

# Remove dangling images
docker image prune -f

# Rebuild and start
docker-compose up --build
```

## Production Deployment

For production, consider:

1. **Change SECRET_KEY**: Use a strong, random secret
2. **Use environment files**: Create `.env` files instead of hardcoding
3. **Enable HTTPS**: Use a reverse proxy (nginx, Traefik)
4. **Build optimized images**: Use multi-stage builds
5. **Set resource limits**: Add memory/CPU limits to services
6. **Use production database**: Separate database server
7. **Enable logging**: Configure proper log management
8. **Backup database**: Regular automated backups

Example production adjustments:

```yaml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

## Useful Docker Commands

```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View images
docker images

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# View disk usage
docker system df

# Clean everything
docker system prune -a --volumes
```

## Health Checks

The database includes a health check. View status:

```bash
docker-compose ps
```

Healthy services show "(healthy)" status.

## Networking

All services are on the same Docker network and can communicate:

- Frontend → Backend: `http://backend:8000`
- Backend → Database: `postgresql://user:pass@db:5432/dbname`

External access uses localhost and mapped ports.
