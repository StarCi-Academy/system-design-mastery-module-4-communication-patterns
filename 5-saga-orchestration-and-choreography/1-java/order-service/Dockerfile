FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
# Copy pom first so dependency layer is cached unless pom changes.
COPY pom.xml ./
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
# Bind on all interfaces so Docker port mapping works.
EXPOSE 3011
CMD ["java", "-jar", "app.jar"]
