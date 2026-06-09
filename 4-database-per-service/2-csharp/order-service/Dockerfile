FROM mcr.microsoft.com/dotnet/sdk:8.0 AS builder
WORKDIR /app
# Restore dependencies first for better layer caching.
COPY *.csproj ./
RUN dotnet restore
# Copy source and publish.
COPY . ./
RUN dotnet publish -c Release -o /publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=builder /publish .
# Container listens on port 3021 — distinct from TS (3001) and Java (3011) tracks.
EXPOSE 3021
ENTRYPOINT ["dotnet", "order-service.dll"]
