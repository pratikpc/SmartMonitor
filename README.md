# SmartMonitor:- A Digital Signage Solution

[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier) 

## Introduction

1. Electronic waste has emerged as a major public health and environmental issue. India is the fifth largest electronic waste producer in the world.
2. Annually, computer devices account for nearly 70% of e-waste. Monitors and televisions are disposed even while they are still working.
3. So, to reduce waste and promote reuse, these can be used as low cost digital signage.
4. Billboards and notices are single-use, take time to design, create and print which increase expense. 
5. Further printed media is difficult, labor intensive, expensive to setup, and it’s difficult to have multiple media with one at a specific time of day. After use, notices are also difficult to dispose, and sometimes are not even removed.
5. As such, a digital signage solution like SmartMonitor would lead to:-
 	1.  Reuse of display devices
 	2.  Reduce the need for printing notices and billboards
 	3.  Reduce labor expenses 
 	4.  Support flexible time-based media deployment 
 	5.  Save time as these can be setup in a 
 		1. Low-cost efficient manner
 		2. Remotely controlled.

## Objectives

1. Build an IoT based Digital Signage notice board which can be remotely managed using a web-based dashboard.
2. Must be cost-effective, portable and efficient
3. Easy to deploy
4. Shorter latency and lead times
5. Display media at Specific times of day
6. Reduce Electronic waste by promoting reuse of displays.

## Usage
1. An authenticated user first selects the media and the display device(s).
2. The uploaded media is sent to the server
3. The server processes and stores the media and its metadata in MongoDB and PostgreSQL database respectively.
4. The server signals user-selected display clients.
5. The JavaFX based display client then downloads the user's media.
6. This media is added to the local display client queue.

## Hardware Required
1. Server which can support Docker (You can use AWS or Heroku if you want)
2. Display connected via HDMI to Raspberry Pi 4 (If you don't want to show photos or GIFs, use Pi 3B+)

## Running

### Server

1. Run using docker-compose build & docker-compose up to start the server and all other dependencies
2. Modify .env file for your own custom configurations

#### Media Displayer

1. Is a JavaFX Application
2. Built using Maven as a Package Manager
3. Use mvn install to create the jar file
4. Run with java -jar target\\file-name.jar

## Architecture Diagram

![Architecture Diagram](docs/Smart%20Monitor%20Architecture.jpeg)

## Images

### Dashboard

![Dashboard](docs/Screenshot%20Display.png)

### Display List

![Displays](docs/Screenshot%20Display%202.png)
