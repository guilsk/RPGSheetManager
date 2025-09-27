@echo off
REM ============================================
REM RPG Sheet Manager - Script de desenvolvimento
REM ============================================
REM Execute uma vez no diretório do projeto para configurar o comando 'rpg':
REM   $env:PATH += ";$PWD"
REM
REM Como executar:
REM   rpg start  - Inicia API (.NET) e Cliente (Angular)
REM   rpg api    - Inicia apenas a API
REM   rpg client - Inicia apenas o Cliente
REM
REM
REM Se executado do VS Code, usa o terminal integrado
REM Senão, abre janelas separadas do CMD
REM API roda em: https://localhost:7111
REM Cliente roda em: http://localhost:4200
REM ============================================

REM Detecta se está rodando no VS Code
set "VSCODE_TERMINAL="
if defined TERM_PROGRAM (
    if "%TERM_PROGRAM%"=="vscode" set "VSCODE_TERMINAL=1"
)
if defined VSCODE_PID set "VSCODE_TERMINAL=1"

if "%1"=="start" (
    echo [1/2] Abrindo terminal da API...
    cd /d "%~dp0server\RPGSheetManager"
    start "RPG-API" cmd /k "echo === API - RPG Sheet Manager === && dotnet run --project RPGSheetManager.API"
    cd /d "%~dp0"
    timeout /t 2 /nobreak > nul
    echo [2/2] Abrindo terminal do Cliente...
    cd /d "%~dp0client"
    start "RPG-Client" cmd /k "echo === Cliente - RPG Sheet Manager === && npm start"
    cd /d "%~dp0"
    echo.
    echo Servicos iniciados:
    echo   API: https://localhost:7111
    echo   Cliente: http://localhost:4200
    echo.
) else if "%1"=="api" (
    echo Iniciando apenas a API...
    cd /d "%~dp0server\RPGSheetManager"
    if defined VSCODE_TERMINAL (
        dotnet run --project RPGSheetManager.API
    ) else (
        start "API" cmd /k dotnet run --project RPGSheetManager.API
    )
    cd /d "%~dp0"
) else if "%1"=="client" (
    echo Iniciando apenas o Cliente...
    cd /d "%~dp0client"
    if defined VSCODE_TERMINAL (
        npm start
    ) else (
        start "Client" cmd /k npm start
    )
    cd /d "%~dp0"
) else if "%1"=="setup" (
    echo Configurando comando 'rpg'...
    echo set PATH=%%PATH%%;%~dp0 >> "%USERPROFILE%\.rpgpath"
    echo Adicione esta linha ao seu perfil do PowerShell:
    echo $env:PATH += ";%~dp0"
    echo.
    echo Ou execute uma vez: setx PATH "%%PATH%%;%~dp0" /M
) else (
    echo Uso: rpg [start^|api^|client^|setup]
    echo.
    echo Para usar sem .\ execute: rpg setup
)
