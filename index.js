const express = require('express');
const fs = require('fs');
const { spawn } = require("child_process");
const chalk = require('chalk');
const path = require('path');
const axios = require("axios");
const app = express();

const config = require('./config.json');

const commandsPath = './modules/commands';
const eventsPath = './modules/events';

const getFilesCount = (dirPath) => {
  try {
    return fs.readdirSync(dirPath).length;
  } catch (e) {
    return 0;
  }
};

let botStartTime = Date.now();

async function getBotInformation() {
  return {
    owner: {
      name: config.BOTOWNER,
      uid: config.ADMINUID,
    },
    bot: {
      name: config.BOTNAME,
      uid: config.ADMINUID,
      lang: config.language,
      fmd: config.FCA,
    },
    fca: {
      module: config.FCA,
    }
  };
}

function sendLiveData(socket) {
  setInterval(() => {
    const uptime = Date.now() - botStartTime;

    socket.emit('real-time-data', { uptime });
  }, 1000);
}

app.get('/dashboard', async (req, res) => {
  const commandsCount = getFilesCount(commandsPath);
  const eventsCount = getFilesCount(eventsPath);
  const uptime = Date.now() - botStartTime;
  const botInformation = await getBotInformation();

  res.json({
    botLang: botInformation.bot.lang,
    botName: botInformation.bot.name,
    botUid: botInformation.bot.uid,
    botFmd: botInformation.bot.fmd,
    ownerName: botInformation.owner.name,
    ownerUid: botInformation.owner.uid,
    prefix: config.PREFIX,
    commandsCount: commandsCount,
    eventsCount: eventsCount,
    uptime: uptime
  });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'yor.html')));

const http = require('http');
const { Server } = require("socket.io");
const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
  console.log('New client connected');
  sendLiveData(socket);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

function startBot() {
  const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "jr.js"], {
      cwd: __dirname,
      stdio: "inherit",
      shell: true
  });

  child.on("close", (codeExit) => {
    console.log(`Bot process exited with code: ${codeExit}`);
    if (codeExit !== 0) {
       setTimeout(startBot, 3000); 
    }
  });

  child.on("error", (error) => {
    console.error(`An error occurred starting the bot: ${error}`);
  });
}

startBot();

const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
  console.log(`Server with real-time updates running on http://localhost:${port}`);
});

module.exports = app;
