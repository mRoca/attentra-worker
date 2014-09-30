# debian/raspbian installation

apt-get update -y
apt-get install curl -y

curl -sL https://deb.nodesource.com/setup | bash -
apt-get install nodejs -y
apt-get autoremove -y

npm install -g forever
npm update
