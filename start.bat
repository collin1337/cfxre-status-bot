@echo off

echo Cfx.re Discord Status Bot - collin1337

if exist "node_modules" (
  color 02
  echo Packages found in node_modules.
) else (
  color 04
  echo node_modules not found. Installing Packages
  npm install
)

node src/index.js
