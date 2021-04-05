![GitHub Logo](https://token.smartlink.so/wp-content/uploads/2021/04/Logo-HD-1.png)


# Overview
Smartlink is building a decentralized escrow payment system on Tezos coupled with marketplace functionalities for Web 3.0. 
Here you'll find the current demo of the Smartlink platform. This initial version aims to set the basis for escrow payments and basic transactions.

## Framework used
<b>Built with</b>
- [Tezos](https://tezos.com/)
- [VueJS](https://vuejs.org/)
- [Vuetify](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Taquito](https://tezostaquito.io/)
- [Temple Wallet](https://templewallet.com/)

## Local installation
### Install Temple Wallet
1. Go to https://templewallet.com/download and select your browser.
2. Create a new Temple wallet. Do not forget to make a backup of your seed phrase!

### Get an Edo2net testnet account
1. Open your Temple wallet
3. At the top right, click on "Tezos Mainnet", and choose "Edo2 testnet"
4. At the top right, click on your account picture, and go to "Import account"
5. Go to "Faucet file"
6. Go to the website https://faucet.tzalpha.net/ and click on "Get Testnet tz"
7. Download the .json file of your faucet account
8. Go back to Temple, and select "Select JSON file", then click "Submit"
9. Wait while your account activation is being confirmed
10. Once your account activation is confirmed, you will be redirected to your account page

### Run the app
#### Required libraries
Node 14 or higher is required to run the originate function.
##### Install node on MAC
1. Go to https://nodejs.org/en/download/ and choose "macOS Installer".
2. Follow the instructions on the wizard. 
3. Once it is complete, to check that the installation was successful, run:

``` bash 
node -v
npm -v
```
##### Install node on Linux
1. Open your terminal, and run:
``` bash 
sudo apt update
sudo apt install nodejs npm
```
2. Once it is complete, to check that the installation was successful, run:
``` bash 
node -v
npm -v
```
#### Run the demo
##### Install the project dependencies
2. In order to install the project dependencies, run the following command in your terminal at the root directory of the project
``` bash 
npm install
```
It will create the directory node_modules  containing all the installed modules and package.lock.json 

##### Run the project
1. In order to launch the project, run:
``` bash 
npm run serve
```
Congrats, your project is up and running!

##### Open the project
To open the project, you may use the two local URLs which you can access from your browser:
- Local:   http://localhost:8080/ 
- Network: http://192.168.0.33:8080/

The URLs may vary depending on the ports available on your computer.

## Contributing 
We appreciate all types of contributions from anyone! The tiniest adjustments will sometimes make a huge difference. Please have a look around. 
Feel free to ask questions on our [Telegram](https://t.me/smartlinkofficial), or submit a GitHub pull request.
