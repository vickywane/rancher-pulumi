#!/bin/sh

sudo apt-get update

sudo apt-get install apt-transport-https ca-certificates curl gnupg lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update

sudo apt install -y docker.io

sudo docker run -d --restart=unless-stopped \
  -p 80:80 -p 443:443 -e CATTLE_BOOTSTRAP_PASSWORD="iamnwani01!" \
  --privileged \
  rancher/rancher:latest

