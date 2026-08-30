# Quick Start Guide

## Local Development (Fastest Way)

### 1. Prerequisites Check
```bash
java -version  # Should be 17 or higher
psql --version  # PostgreSQL should be installed
```

### 2. Setup Database
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE food4fit;
\q
```

### 3. Configure Application
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/food4fit
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD
```

### 4. Run Application
```bash
# Windows
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw spring-boot:run
```

### 5. Access Application
Open browser: `http://localhost:8080/auth/login`

---

## Docker Deployment (Easiest for Production)

### 1. Build and Run Everything
```bash
docker-compose up -d
```

### 2. View Logs
```bash
docker-compose logs -f app
```

### 3. Stop Everything
```bash
docker-compose down
```

### 4. Access Application
Open browser: `http://localhost:8080/auth/login`

---

## Standalone JAR Deployment

### 1. Build JAR
```bash
.\mvnw.cmd clean package
```

### 2. Run JAR
```bash
java -jar target/food4fit-0.0.1-SNAPSHOT.jar
```

### 3. With Custom Port
```bash
java -jar -Dserver.port=8081 target/food4fit-0.0.1-SNAPSHOT.jar
```

---

## Common Commands

### Build
```bash
.\mvnw.cmd clean package
```

### Run Tests
```bash
.\mvnw.cmd test
```

### Check Application Health
```bash
curl http://localhost:8080/auth/login
```

### View Database
```bash
psql -U postgres -d food4fit
```

---

## Troubleshooting

**Port 8080 already in use?**
- Change port: Add `server.port=8081` to `application.properties`

**Database connection failed?**
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `application.properties`

**Build fails?**
- Clean and rebuild: `.\mvnw.cmd clean install`

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

