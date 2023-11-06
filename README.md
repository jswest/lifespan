# Lifespan of a Site
_A tool to understand how long a set of websites lasts for._

## Installation

First, there are some prerequisates.

You must have a modern version of Python available.

```bash
brew update
brew install pyenv
pyenv install 3.11
pyenv global 3.11
```

You must have `poetry` [installed](https://python-poetry.org/docs/).

You must have a modern version of Node available.

```bash
nvm install 20
nvm use 20
```

Then, you can run:

```bash
npm install
poetry install
```

Finally, you'll need to fill in some environment variables.

```bash
cp sample.env .env
```

Fill them in, and you're good to go!

## Running it

First, we need to get into the environment.

```bash
poetry shell
```

## Installing dependencies on Raspberry Pi

```bash
sudo apt install chromium-browser chromium-codecs-ffmpeg
sudo apt-get install ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

