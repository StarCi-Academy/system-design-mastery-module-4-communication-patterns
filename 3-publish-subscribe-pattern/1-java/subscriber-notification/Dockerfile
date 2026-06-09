# Stage 1 — build the fat JAR with Maven
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -q

COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2 — minimal runtime image
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

# Run the notification subscriber service.
ENTRYPOINT ["java", "-jar", "app.jar"]
