@echo off

set COMPILER_DIR=.\compiler\
set SOURCE_DIR=..\src\
set EXTERNS_DIR=.\externs\
set OUTPUT_DIR=.\output\
set OUTPUT_ZIP_FILE=PersonalizedWeb-bin.zip
set LICENSE_JS_FILE=%SOURCE_DIR%\common\license.js
set LICENSE_HTML_FILE=%SOURCE_DIR%\common\license.html

set COMPILER_BASE_ARGUMENTS=^
  --js=%EXTERNS_DIR%\webkit_console.js ^
  --js=%SOURCE_DIR%\common\base.js ^
  --module=base:2

rem Parse BUILD arguments
:ARGUMENTS_LOOP
  IF /I "%1" EQU "--keep_logs" (
    set COMPILER_BASE_ARGUMENTS=^
      --externs=%EXTERNS_DIR%\webkit_console.js ^
      --js=%SOURCE_DIR%\common\base.js ^
      --module=base:1
  ) ELSE IF /I "%1" EQU "--pretty_print" (
    set FORMATTING_ARGUMENTS=^
      --formatting=PRETTY_PRINT ^
      --formatting=PRINT_INPUT_DELIMITER
  ) ELSE IF /I "%1" EQU "--zip" (
    set DO_ZIP_FILE=1
  ) ELSE IF "a%1" NEQ "a" (
    echo Error: unrecognized argument: %1
    goto END
  )
  shift
  IF "a%1" NEQ "a" goto ARGUMENTS_LOOP


echo Compiling...
java -jar %COMPILER_DIR%\compiler.jar ^
  --compilation_level=ADVANCED_OPTIMIZATIONS ^
  --module_output_path_prefix=%OUTPUT_DIR% ^
  --warning_level=VERBOSE ^
  --summary_detail_level=3 ^
  --externs=%EXTERNS_DIR%\chrome_extensions.js ^
  --externs=%EXTERNS_DIR%\json.js ^
  %FORMATTING_ARGUMENTS% ^
  %COMPILER_BASE_ARGUMENTS% ^
  --js=%SOURCE_DIR%\common\preferences.js ^
  --js=%SOURCE_DIR%\content\main.js ^
  --js=%SOURCE_DIR%\background\tabmask.js ^
  --js=%SOURCE_DIR%\background\background.js ^
  --js=%SOURCE_DIR%\options\dom_utils.js ^
  --js=%SOURCE_DIR%\options\options.js ^
  --module=preferences:1:base ^
  --module=main:1:base ^
  --module=tabmask:1:base ^
  --module=background:1:base,preferences,tabmask ^
  --module=dom_utils:1:base ^
  --module=options:1:base,preferences,dom_utils


IF %ERRORLEVEL% NEQ 0 goto END

echo.
echo Generated Javascript files:

FOR /F "tokens=1-4*" %%A IN ('dir /-C %OUTPUT_DIR%\*.js') DO (
 IF "a%%E" EQU "a" IF "a%%D" NEQ "a" (
   IF "%%B" EQU "File(s)" (
     echo.
     echo Total size: %%C %%D
   ) ELSE (
     echo %%C	%%D
   )
 )
)

rem ROOT
copy /Y %SOURCE_DIR%\adblocker_rules.json %OUTPUT_DIR%\adblocker_rules.json > nul
copy /Y %SOURCE_DIR%\manifest.json %OUTPUT_DIR%\manifest.json > nul

rem /background
copy /Y %SOURCE_DIR%\background\background.html %OUTPUT_DIR%\background.html > nul
call :MOVE_OUTPUT_FILE background background.html tabmask.js background.js

rem /common
call :MOVE_OUTPUT_FILE common base.js preferences.js

rem /content
call :MOVE_OUTPUT_FILE content main.js

rem /images
mkdir %OUTPUT_DIR%\images > nul 2>&1
copy /Y %SOURCE_DIR%\images %OUTPUT_DIR%\images > nul

rem /_locales
mkdir %OUTPUT_DIR%\_locales > nul 2>&1
xcopy /Y /S /E %SOURCE_DIR%\_locales %OUTPUT_DIR%\_locales > nul

rem /options
mkdir %OUTPUT_DIR%\options > nul 2>&1
copy /Y %SOURCE_DIR%\options\options.css %OUTPUT_DIR%\options.css > nul
copy /Y %SOURCE_DIR%\options\options.html %OUTPUT_DIR%\options.html > nul
call :MOVE_OUTPUT_FILE options options.css options.html options.js dom_utils.js

rem ZIP the files
IF "%DO_ZIP_FILE%" NEQ "1" goto END
echo.
echo Making a ZIP file...
erase %OUTPUT_ZIP_FILE% > nul 2>&1
cd %OUTPUT_DIR%
pkzipc -add -attr=all -dir ../%OUTPUT_ZIP_FILE% ./*
cd ..

:END
pause
goto :EOF

rem ===========================================================================
rem MOVE_OUTPUT_FILE
rem ===========================================================================
:MOVE_OUTPUT_FILE
setlocal
set DIR_TO_MOVE_TO=%OUTPUT_DIR%\%1
shift

IF NOT EXIST %DIR_TO_MOVE_TO% (
  mkdir %DIR_TO_MOVE_TO% > nul 2>&1
)
:MOVE_OUTPUT_FILE_LOOP
  IF /I "%~x1" EQU ".js" (
    copy /Y %LICENSE_JS_FILE% + %OUTPUT_DIR%\%1 %DIR_TO_MOVE_TO%\%1 /B > nul
  ) ELSE IF /I "%~x1" EQU ".css" (
    copy /Y %LICENSE_JS_FILE% + %OUTPUT_DIR%\%1 %DIR_TO_MOVE_TO%\%1 /B > nul
  ) ELSE IF /I "%~x1" EQU ".html" (
    copy /Y %LICENSE_HTML_FILE% + %OUTPUT_DIR%\%1 %DIR_TO_MOVE_TO%\%1 /B > nul
  ) ELSE (
    move /Y %OUTPUT_DIR%\%1 %DIR_TO_MOVE_TO%\%1 > nul
  )
  erase %OUTPUT_DIR%\%1 > nul 2>&1
  shift
  IF "a%1" NEQ "a" goto MOVE_OUTPUT_FILE_LOOP

endlocal
goto :EOF
