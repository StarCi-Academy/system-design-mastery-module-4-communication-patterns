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
# Container listens on port 3022 — distinct from TS (3002) and Java (3012) tracks.
EXPOSE 3022
ENTRYPOINT ["dotnet", "inventory-service.dll"]
