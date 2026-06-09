FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy pom.xml first for layer caching — dependencies downloaded once unless pom changes.
COPY pom.xml ./
RUN mvn dependency:go-offline -q
COPY src ./src
# Build the fat jar; skip tests (demo lesson, no unit tests).
RUN mvn package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copy only the executable jar — smaller final image.
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8000
# Run the Spring Boot fat jar; Spring reads server.port from application.properties.
CMD ["java", "-jar", "app.jar"]
