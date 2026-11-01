@echo off
setlocal DisableDelayedExpansion
if "%~1"=="" (
  echo Usage: validate-story.cmd "path to saved.story"
  exit /b 2
)
set "STORY_FILE=%~f1"
pushd "%~dp0..\.." || exit /b 2
node --import tsx scripts/check-stories.ts "%STORY_FILE%"
set "VALIDATION_EXIT=%ERRORLEVEL%"
popd
exit /b %VALIDATION_EXIT%
