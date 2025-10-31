# Multi-stage build for CloudShop Customer Service

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom.xml and download dependencies (cached layer)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Install wget for healthcheck and create non-root user
RUN apk add --no-cache wget && \
    addgroup -S spring && adduser -S spring -G spring

# Copy JAR from build stage (as root)
COPY --from=build /app/target/*.jar app.jar
RUN chown spring:spring app.jar

# Switch to non-root user
USER spring:spring

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

# Expose port
EXPOSE ${PORT:-3004}

# Run application
ENTRYPOINT ["java", "-jar", "app.jar"]

