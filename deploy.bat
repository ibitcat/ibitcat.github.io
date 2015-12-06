@echo off

call hexo clean
call hexo g

set workdir=%cd%

set source=%workdir%\source\_posts
set dest=%workdir%\public\post

if exist %dest% rd  %dest% /s /q
md  %dest%
xcopy %source% %dest% /e /y

call hexo deploy

pause










