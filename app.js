const soap = require("soap");
const fs = require("fs");
const inquirer = require("inquirer");
let envs;
let envChoice;
let username;
let password;
let workOrder;
let iterations;
const secOptions = {
  hasTimeStamp: false,
  hasTokenCreated: false,
  passwordType: "PasswordText",
};

try {
  const data = fs.readFileSync("./envs.json", "utf8");
  envs = JSON.parse(data);
} catch (err) {
  console.error(err);
}

async function askQuestions() {
  let questions = [
    {
      type: "list",
      name: "env",
      message: "Environment:",
      choices: Object.keys(envs),
    },
    {
      type: "input",
      name: "uname",
      message: "Username:",
    },
    {
      type: "password",
      name: "pass",
      message: "Password:",
    },
    {
      type: "input",
      name: "wo",
      message: "Work Order:",
    },
    {
      type: "number",
      name: "num",
      message: "Number of cloned work orders:",
    },
  ];

  inquirer.prompt(questions).then(async (answers) => {
    envChoice = answers["env"];
    username = answers["uname"];
    password = answers["pass"];
    workOrder = answers["wo"];
    iterations = answers["num"];
    await cloneWo(iterations, workOrder);
  });
}

async function retrieveWo(woNum) {
  const url = envs[envChoice]["url"];

  let args = {
    context: {
      districtCode: "RTK1",
    },
    requestParameters: {
      districtCode: "RTK1",
      workOrder: {
        prefix: woNum.substring(0, 2),
        no: woNum.substring(2),
      },
    },
  };

  let wsSecurity = new soap.WSSecurity(username, password, secOptions);

  return new Promise((resolve, reject) => {
    soap.createClient(url, function (err, client) {
      client.setSecurity(wsSecurity);
      client.read(args, function (err, result) {
        try {
          if (1 === 1) {
            //           console.log(result["out"]["TableCodeServiceResult"]);
            //  console.log(result["out"]);
            resolve(result["out"]);
          } else {
            //Delete has failed, show error message and reject the results
            console.log("error 1");
            console.log(result);
            reject(result.out.errors);
          }
        } catch (e) {
          //Delete has failed, show error message
          console.log("error 2");
          console.log(result);
        }
      });
    });
  });
}

async function cloneWo(iter, woNum) {
  const url = envs[envChoice]["url"];
  let woResult = await retrieveWo(woNum);

  delete woResult["workOrder"];

  let args = {
    context: {
      districtCode: "RTK1",
    },
    requestParameters: woResult,
  };

  let wsSecurity = new soap.WSSecurity(username, password, secOptions);

  for (let i = 0; i < iter; i++) {
    createWo(args);
  }

  async function createWo(args) {
    return new Promise((resolve, reject) => {
      soap.createClient(url, function (err, client) {
        client.setSecurity(wsSecurity);
        client.create(args, function (err, result) {
          try {
            if (1 === 1) {
              //           console.log(result["out"]["TableCodeServiceResult"]);
              console.log(
                result["out"]["workOrder"]["prefix"] +
                  result["out"]["workOrder"]["no"]
              );
              resolve(result["out"]);
            } else {
              //Delete has failed, show error message and reject the results
              console.log("error 1");
              console.log(result);
              reject(result.out.errors);
            }
          } catch (e) {
            //Delete has failed, show error message
            console.log("error 2");
            console.log(result);
          }
        });
      });
    });
  }
}

askQuestions();
