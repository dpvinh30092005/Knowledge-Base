# Food4Fit Deployment Guide

This guide covers how to deploy the Food4Fit Spring Boot application.

## Prerequisites

- **Java 17** or higher
- **Maven 3.6+** (or use the included Maven Wrapper)
- **PostgreSQL** database
- **Git** (for version control)

## 1. Local Development Setup

### Step 1: Install PostgreSQL

1. Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database:
   ```sql
   CREATE DATABASE food4fit;
   ```
3. Note your PostgreSQL username and password

### Step 2: Configure Database

Update `src/main/resources/application.properties` with your database credentials:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/food4fit
spring.datasource.username=your_username
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.thymeleaf.cache=false
```

### Step 3: Build and Run

**Using Maven Wrapper (Recommended):**
```bash
# Windows
.\mvnw.cmd clean install
.\mvnw.cmd spring-boot:run

# Linux/Mac
./mvnw clean install
./mvnw spring-boot:run
```

**Using Maven (if installed):**
```bash
mvn clean install
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

## 2. Production Deployment Options

### Option A: Standalone JAR File (Recommended for Simple Deployments)

#### Build the JAR:

```bash
# Using Maven Wrapper
.\mvnw.cmd clean package

# Using Maven
mvn clean package
```

This creates a JAR file in `target/food4fit-0.0.1-SNAPSHOT.jar`

#### Run the JAR:

```bash
java -jar target/food4fit-0.0.1-SNAPSHOT.jar
```

#### Production Configuration:

Create `application-prod.properties`:

```properties
spring.datasource.url=jdbc:postgresql://your-db-host:5432/food4fit
spring.datasource.username=your_prod_username
spring.datasource.password=your_prod_password

spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.thymeleaf.cache=true

server.port=8080
logging.level.root=INFO
```

Run with production profile:
```bash
java -jar -Dspring.profiles.active=prod target/food4fit-0.0.1-SNAPSHOT.jar
```

### Option B: Docker Deployment

#### Create Dockerfile:

```dockerfile
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .

# Download dependencies
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Run the application
ENTRYPOINT ["java", "-jar", "target/food4fit-0.0.1-SNAPSHOT.jar"]
```

#### Build and Run Docker Container:

```bash
# Build image
docker build -t food4fit:latest .

# Run container
docker run -d \
  -p 8080:8080 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/food4fit \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  --name food4fit \
  food4fit:latest
```

#### Docker Compose (with PostgreSQL):

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: food4fit
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 1234
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/food4fit
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: 1234
    depends_on:
      - postgres

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

### Option C: Cloud Platform Deployment

#### Heroku:

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create food4fit-app`
4. Add PostgreSQL: `heroku addons:create heroku-postgresql:hobby-dev`
5. Deploy: `git push heroku main`

#### AWS Elastic Beanstalk:

1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create food4fit-env`
4. Deploy: `eb deploy`

#### Google Cloud Platform (App Engine):

1. Create `app.yaml`:
```yaml
runtime: java17
env: standard
instance_class: F2
```

2. Deploy: `gcloud app deploy`

#### Azure App Service:

1. Install Azure CLI
2. Create resource group: `az group create --name food4fit-rg --location eastus`
3. Create app service plan: `az appservice plan create --name food4fit-plan --resource-group food4fit-rg --sku B1`
4. Create web app: `az webapp create --resource-group food4fit-rg --plan food4fit-plan --name food4fit-app --runtime "JAVA:17-java17"`
5. Deploy: `mvn clean package && az webapp deploy --resource-group food4fit-rg --name food4fit-app --type jar --src-path target/food4fit-0.0.1-SNAPSHOT.jar`

## 3. Environment Variables

For production, use environment variables instead of hardcoding credentials:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/food4fit
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=your_password
```

Or update `application.properties` to use environment variables:

```properties
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/food4fit}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:1234}
```

## 4. Security Considerations

1. **Never commit credentials** - Use environment variables or secure vaults
2. **Use HTTPS** in production - Configure SSL/TLS certificates
3. **Update default passwords** - Change database and application passwords
4. **Enable CSRF protection** - Already configured in Spring Security
5. **Set proper CORS** - Configure if using API endpoints
6. **Use production database** - Set `spring.jpa.hibernate.ddl-auto=validate` in production

## 5. Monitoring and Logging

### Application Logs:

Spring Boot logs to console by default. For production, configure logging:

```properties
logging.file.name=logs/food4fit.log
logging.level.root=INFO
logging.level.com.food4fit=DEBUG
```

### Health Checks:

Spring Boot Actuator (add to `pom.xml` if needed):

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

## 6. Performance Optimization

1. **Enable Thymeleaf cache** in production:
   ```properties
   spring.thymeleaf.cache=true
   ```

2. **Disable SQL logging** in production:
   ```properties
   spring.jpa.show-sql=false
   ```

3. **Use connection pooling** (already included with Spring Boot)

4. **Enable JPA query cache** if needed

## 7. Troubleshooting

### Port Already in Use:
```bash
# Find process using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Linux/Mac

# Change port in application.properties
server.port=8081
```

### Database Connection Issues:
- Verify PostgreSQL is running
- Check firewall settings
- Verify credentials in `application.properties`
- Ensure database exists

### Build Issues:
- Clear Maven cache: `mvn clean`
- Delete `target` folder and rebuild
- Check Java version: `java -version` (should be 17+)

## 8. Quick Start Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `food4fit` created
- [ ] `application.properties` configured
- [ ] Application builds successfully (`mvn clean package`)
- [ ] Application runs locally
- [ ] Can access login page at `http://localhost:8080/auth/login`
- [ ] Database tables created automatically
- [ ] Production environment variables set
- [ ] Security credentials updated
- [ ] Logging configured
- [ ] Monitoring set up (optional)

## Support

For issues or questions, check:
- Spring Boot Documentation: https://spring.io/projects/spring-boot
- PostgreSQL Documentation: https://www.postgresql.org/docs/

