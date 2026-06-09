# Stage 1 — build the fat JAR with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and fetch dependencies first (layer-cached unless pom changes).
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source and build the JAR.
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2 — minimal runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the fat JAR from the build stage.
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 3001

# Run the publisher service.
ENTRYPOINT ["java", "-jar", "app.jar"]
