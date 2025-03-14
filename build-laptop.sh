#!/usr/bin/env bash

export PATH="/media/araneta/49909430-d2bd-4bcf-be1d-3c425a4013bf/apps/go1.22/bin:$PATH"

go env -w GOPATH=$PWD


cd src
#run
go version
go env
go mod tidy

#go run  main.go 
#go run main.go 
#go build

#

#build debug
#go build main.go

#@build release linux 
go build -ldflags "-s -w"  -o "../../dist/teloeditor"

#@build release win
#env GOOS=windows GOARCH=amd64 go build -ldflags "-s -w" -o "../../dist/goder.exe"
cd ..
rm -R ../dist/public
cp -r public ../dist/

rm -R ../dist/parser
cp -r parser ../dist/
rm ../dist/parser/temp/*

rm -R ../dist/templates
cp -r src/templates ../dist/
