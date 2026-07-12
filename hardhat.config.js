import "@nomicfoundation/hardhat-toolbox";

// Usando el RPC público de Soneium Minato Testnet
const MINATO_RPC_URL = "https://rpc.minato.soneium.org/";
const PRIVATE_KEY = "5e1fb74f01451ca1ee2a45c2eb0cdc13142f8026c363f3643633c533df20a2de"; // Llave privada

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.28",
  networks: {
    minato: {
      url: MINATO_RPC_URL,
      chainId: 1946,
      accounts: [PRIVATE_KEY]
    }
  }
};
