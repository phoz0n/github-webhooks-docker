const http = require("http");
const crypto = require("crypto");
const { exec } = require("child_process");

const BRANCH = "";
const SECRET = "";
const REPO = "";
const PROJECT = "";
const EXPOSE_PORT = "";
const BIND_IP = "";

const Execute = async command =>
  new Promise((resolve, reject) => {
    const cmd = exec(command, err => {
      if (err) reject(err);
      else resolve();
    });
    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stdout);
  });

const Log = async str => {
  console.log(str);
  if (!str) return await Execute(`echo "" >> deploy.log`);
  await Execute(`echo "[${new Date().toISOString()}] : ${str}" >> deploy.log`);
};

Log("Starting service.");

async function updateContainer() {
  await Log(`starting deployment...`);

  await Log("----- removing old source if it exists -----");
  await Execute(`rm -rf ${PROJECT}`);

  await Log("----- cloning project from git repository -----");
  await Execute(`git clone ${REPO} --branch master`);

  await Log("----- running docker compose -----");
  await Execute(`docker-compose up --build -d ${PROJECT}`);

  await Log("----- removing old source -----");
  await Execute(`rm -rf ${PROJECT}`);

  await Log(`finished deployment.`);
  await Log("");
}

http
  .createServer(function(req, res) {
    req.on("data", data => {
      const signature = `sha1=${crypto
        .createHmac("sha1", SECRET)
        .update(data)
        .digest("hex")}`;

      console.log("data = ", data);
      const isPushEvent = req.headers["x-github-event"] === "push";
      const isReallyGithub = req.headers["x-hub-signature"] === signature;
      const body = JSON.parse(data);
console.log(body);
      const isCorrectBranch = body && body.ref === `refs/heads/${BRANCH}`;

      if (isPushEvent && isReallyGithub && isCorrectBranch) {
        Log(`received a good trigger`);
        updateContainer();
      } else {
        Log(`received a wrong trigger`);
        console.log(
          "Didnt work.",
          isPushEvent,
          isReallyGithub,
          isCorrectBranch
        );
      }
    });
    Log(`-> Request.`)
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("Hello World!");
    res.end();
  })
  .listen(3001);