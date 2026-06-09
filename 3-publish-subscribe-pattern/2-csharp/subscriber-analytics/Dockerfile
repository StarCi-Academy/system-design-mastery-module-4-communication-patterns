# Stage 1 — build the .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder

WORKDIR /app

COPY *.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /out

# Stage 2 — minimal runtime image
FROM mcr.microsoft.com/dotnet/runtime:8.0

WORKDIR /app

COPY --from=builder /out .

# Run the analytics subscriber service.
ENTRYPOINT ["dotnet", "subscriber-analytics.dll"]
