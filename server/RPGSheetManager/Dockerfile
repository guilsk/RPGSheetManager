# Dockerfile para RPGSheetManager.API
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copiar arquivos de projeto primeiro (para otimizar cache do Docker)
COPY ["RPGSheetManager.API/RPGSheetManager.API.csproj", "RPGSheetManager.API/"]
COPY ["RPGSheetManager.Application/RPGSheetManager.Application.csproj", "RPGSheetManager.Application/"]
COPY ["RPGSheetManager.Domain/RPGSheetManager.Domain.csproj", "RPGSheetManager.Domain/"]
COPY ["RPGSheetManager.Infra/RPGSheetManager.Infra.csproj", "RPGSheetManager.Infra/"]

# Restaurar pacotes
RUN dotnet restore "RPGSheetManager.API/RPGSheetManager.API.csproj"

# Copiar todo o código fonte
COPY . .

# Build da aplicação
WORKDIR "/src/RPGSheetManager.API"
RUN dotnet build "RPGSheetManager.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RPGSheetManager.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Configurar usuário não-root por segurança
USER $APP_UID
ENTRYPOINT ["dotnet", "RPGSheetManager.API.dll"]