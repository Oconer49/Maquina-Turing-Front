@echo off
cd /d "%~dp0"

if not exist "node_modules\" (
  echo Instalando dependencias...
  call npm install
)

echo Frontend: http://localhost:5173
echo Asegurate de que el backend este corriendo (start-backend.bat)
echo.
call npm run dev
