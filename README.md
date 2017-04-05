# HTTP SQL Query Wrapper for Azure SQL Data Warehouse

- [Introduction](#introction)
- [Quick Start](#quick-start)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Usage](#usage)

## Introduction
This project is a HTTP SQL query wrapper for Azure SQL Data Warehouse built with Node.js.

It helps you query Azure SQL Data Warehouse through HTTP request.

## Quick Start
### Step 1: System Requirement
#### Ubuntu
```sh
sudo apt-get build-essential libssl-dev git
```

#### CentOS
```sh
yum groupinstall "Development Tools"
yum install openssl-devel git
```

### Step 2: nvm & Node.js
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | NVM_DIR=/usr/local/nvm bash
nvm install 7.6.0
nvm use 7.6.0
nvm alias default 7.6.0
```

### Step 3: Node Modules
Install pm2:
```sh
npm install pm2 yarn -g
pm2 install pm2-logrotate
pm2 set pm2-logrotate:retain 5
pm2 startup
```

Install project modules, `cd` to the project folder, and do:
```sh
npm install
```

### Step 4: Configuration
Specify your Azure SQL Data Warehouse configurations in `config.json`.

### Step 5: Build & Run
Build:
```sh
npm run build
```

Start server:
```sh
pm2 start process.json --env production
```

Save current running app
```
pm2 save
```

### Step 6: Execute Query
To execute a SQL command, you need to send a POST request to `http://<ip-or-host>:5000/api/sql` with a body as follows:
```json
{
  "sql": "select * from my_table"
}
```

## Deployment
To run this application, you need to have both Node.js Runtime and Node Modules ready.

### nvm & Node.js

#### Pre-Requirement
To install [nvm](https://github.com/creationix/nvm) (Node Version Manager) and [Node.js](https://nodejs.org/).

First, you will need to make sure your system has a C++ compiler and git installed.

##### Ubuntu
```sh
sudo apt-get build-essential libssl-dev git
```

##### CentOS
```sh
yum groupinstall "Development Tools"
yum install openssl-devel git
```

##### Install nvm
To install or upgrade nvm, you can use the install script using cURL:
```
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | NVM_DIR=/usr/local/nvm bash
```
or Wget:
```
wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | NVM_DIR=/usr/local/nvm bash
```
> The script clones the nvm repository to `~/.nvm` and adds the source line to your profile (`~/.bash_profile`, `~/.zshrc`, `~/.profile`, or `~/.bashrc`).

```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm
```

You can customize the install source, directory, profile, and version using the `NVM_SOURCE`, `NVM_DIR`, `PROFILE`, and `NODE_VERSION` variables.
Eg: `curl ... | NVM_DIR=/usr/local/nvm bash` for a global install.

##### Vefication nvm Installation
To verify that nvm has been installed, do:
```sh
command -v nvm
```
which should output 'nvm' if the installation was successful. Please note that `which nvm` will not work, since `nvm` is a sourced shell function, not an executable binary.

##### Install Node.js
To download, compile, and install the LTS (Long Term Support) release of Node.js, do:
```sh
nvm install --lts
```
And then in any new shell just use the installed version:
```sh
nvm use --lts
```
##### Vefication Node.js Installation
To verify that Node.js has been installed, do:
```sh
node -v
```
Which should output the version of installed Node.js if the installation was successful.

### Node Modules
This project is managed by [PM2](http://pm2.keymetrics.io/), which allows you to keep applications alive forever, to reload them without downtime and to facilitate common system admin task.

It is recommended to install pm2 as global module and other project ones as local module.

#### Install Process Manager
To install pm2, do:
```sh
npm install pm2 -g
```

#### Install Project Modules
To install project modules, `cd` to the project folder, and do:
```sh
npm install
```

#### Keep PM2 Running with System Startup
PM2 can generate startup scripts and configure them in order to keep your process list intact across expected or unexpected machine restarts.

Login as the user you want to run this application, and do:
```
pm2 startup
```
Follow the instructions to complete the startup configuration.

>When updating nodejs, the pm2 binary path might change (it will necessarily change if you are using nvm).<br />
>Therefore, we would advise you to run the startup command after any update.

### Build
To optimize the performance, you need to build the project.
To Build the project, `cd` to the project folder, and do:
```sh
npm run build
```
which should output built files under `./build` folder.

### Deployment Configuration
You can define several deployment environment configurations in `process.json` and run different processes separately as you need by doing:
```sh
pm2 start process.json --env production
```
> Refer to pm2 [documentation](http://pm2.keymetrics.io/docs/usage/cluster-mode/) for more details.

#### Useful Attributes
```
| Field     | Type   | Example                                | Description                                                           |
---------------------------------------------------------------------------------------------------------------------------------------
| name      | string | "my-app"                               | application name                                                      |
| script    | string | "./api/app.js"                         | script path relative to pm2 start                                     |
| instances | number | -1                                     | number of app instance to be launched                                 |
| exec_mode | string | "cluster"                              | mode to start your app, can be "cluster" or "fork", default "fork"    |
| env       | object | {"NODE_ENV": "development", "ID": "1"} | env variables which will appear in your app, -1 to spread to all CPUs |
| env_      | object | {"NODE_ENV": "production", "ID": "2"}  | inject when doing pm2 restart app.json --env                          |
```

#### Switch environments
You may have noticed that you can declare environment-specific variables with the attribute env_* (e.g. env_production, env_staging…).
They can be switched easily. You just need to specify the `--env <environment_name>` when acting on the application declaration.
```sh
# Inject what is declared in env_production
$ pm2 start process.json --env production

# Inject what is declared in env_staging
$ pm2 restart process.json --env staging
```

#### Example
```json
{
  "apps": [{
    "script": "./build/index.js",
    "instances": -1,
    "exec_mode": "cluster",
    "env": {
      "name": "adw-api-dev",
      "ENV": "staging",
      "NODE_ENV": "development",
      "PORT": 3000,
      "LOG_LEVEL": "debug"
    },
    "env_daily": {
      "name": "adw-api-daily",
      "ENV": "daily",
      "NODE_ENV": "production",
      "PORT": 3000,
      "LOG_LEVEL": "info"
    },
    "env_staging": {
      "name": "adw-api-staging",
      "ENV": "staging",
      "NODE_ENV": "production",
      "PORT": 4000,
      "LOG_LEVEL": "info"
    },
    "env_production": {
      "name": "adw-api-production",
      "ENV": "production",
      "NODE_ENV": "production",
      "PORT": 5000,
      "LOG_LEVEL": "info"
    }
  }]
}
```

## Configuration
Before starting this application, you have to specify your Azure SQL Data Warehouse configurations in `config.json`.

You can define several env configurations and switch to any of them easily by specify env variables in `process.json`.

### Example
```json
{
  "default": {
    "user": "username",
    "password": "password",
    "server": "hostname",
    "database": "database",
    "pool": {
      "max": 1024
    },
    "options": {
      "requestTimeout": 30000,
      "encrypt": true
    }
  },
  "daily": {
    "user": "username",
    "password": "password",
    "server": "hostname",
    "database": "database",
    "pool": {
      "max": 1024
    },
    "options": {
      "requestTimeout": 30000,
      "encrypt": true
    }
  },
  "staging": {
    "user": "username",
    "password": "password",
    "server": "hostname",
    "database": "database",
    "pool": {
      "max": 1024
    },
    "options": {
      "requestTimeout": 30000,
      "encrypt": true
    }
  },
  "production": {
    "user": "username",
    "password": "password",
    "server": "hostname",
    "database": "database",
    "pool": {
      "max": 1024
    },
    "options": {
      "requestTimeout": 30000,
      "encrypt": true
    }
  }
}
```

## Usage
Finally, to manage this application, you just need 3 commands as follows.

### Start
To start a new application, do:
```sh
pm2 start process.json --env <environment>
```

### Reload
to gracefully reload a application without downtime, do:
```
pm2 reload <app-id>
```

### Stop
To stop a application, do:
```
pm2 stop <app-id>
```

### How to Query
To execute a SQL command, you need to send a POST request to `http://<ip-or-host>:<port>/api/sql` with a body as follows:
```json
{
  "sql": "select * from my_table",
  "timeout": 30000, // optional, request timeout in milliseconds
  "user": "user", // optional, customized query credentials
  "password": "password" // optional, customized query credentials
}
```
> **Note:** Do **NOT** send more than one queries at the same time, **ONLY** the result of the last query will be returned.
> ```sql
> select * from my_table_1; select * from my_table_2
> ```
> Which will **ONLY** return all rows from `my_table_2`.
