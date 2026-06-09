# Stage 1 — build the .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

# Copy project file and restore dependencies (layer-cached unless csproj changes).
COPY *.csproj .
RUN dotnet restore

# Copy source and publish the self-contained app.
COPY . .
RUN dotnet publish -c Release -o /out

# Stage 2 — minimal ASP.NET runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

COPY --from=builder /out .

EXPOSE 3001

# Run the publisher service.
ENTRYPOINT ["dotnet", "publisher-service.dll"]
