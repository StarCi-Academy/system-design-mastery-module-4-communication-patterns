FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -q
# Copy source and build fat JAR
COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Copy the built fat JAR from the builder stage
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 3001
ENTRYPOINT ["java", "-jar", "app.jar"]
