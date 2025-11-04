# Dockerfile para RPGSheetManager.API
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copiar toda a solution e projetos
COPY . .

# Restaurar pacotes usando o arquivo de solution
RUN dotnet restore "RPGSheetManager.sln"

# Build da aplicação
RUN dotnet build "RPGSheetManager.sln" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RPGSheetManager.API/RPGSheetManager.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Configurar usuário não-root por segurança
USER $APP_UID
ENTRYPOINT ["dotnet", "RPGSheetManager.API.dll"]
