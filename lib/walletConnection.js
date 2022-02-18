import Web3 from "web3";
import WalletConnectProvider from "@walletconnect/web3-provider";

const MetaMaskProvider = () => {
  if (window.ethereum) {
    if (window.ethereum.providers)
      return window.ethereum.providers.find((provider) => provider.isMetaMask);
    return window.ethereum;
  }
  return false;
};


const CoinBaseProvider = () => {
  if (window.walletLinkExtension) return window.walletLinkExtension;
  else {
    console.log("Checking Coinbase");
    return false;
  }
};


// const openModal = ref(false)
const Wallet = {
  provider: null,
};
let web3 = {};


/**
 * Restore existing Wallet Connection (Metamask)
 */
const checkConnectedProvider = async ($store) => {

  const isMetaMask = await isMetamaskConnected($store);

  if (isMetaMask) {
    Wallet.provider = isMetaMask;
    return isMetaMask;
  } else {
    const isCoinBase = await isCoinBaseConnected($store);
    if (isCoinBase) {
      Wallet.provider = isCoinBase;
      return isCoinBase;
    }

    const isWallectConnect = await isWallectConnectConnected($store);
 
    if (isWallectConnect) {
      return isWallectConnect;
    }
    return false;
  }
};

const WalletIsConnected = async ($store, $router) => {
  setTimeout(() => {
    $store.commit("utils/setIsLoadingWallet", false);
  }, 2500);
  const connectStatus = await checkConnectedProvider($store);

  if (connectStatus) {
    const balance = await checkBalanceOfAddress(
      Wallet.provider,
      $store.getters["utils/Account"]
    );
    if (balance > 0) {
      $store.commit("utils/setAccountMinted", true);
      $router.push("/minted");
      return;
    }

    $router.push("/explore");
  }
};

/**
 * Verify Existing MetaMask connections
 * @param {Object} $store inject vuex store object
 * @param {Object} $router inject vue router object
 * @returns
 */
const isMetamaskConnected = async ($store) => {
  try {
    const metaMaskProvider = MetaMaskProvider();
    if (!metaMaskProvider) {
      return false;
    }

    const accounts = await metaMaskProvider.request({ method: "eth_accounts" });
    // console.log(accounts);
    if (accounts.length !== 0) {
      const chainId = await metaMaskProvider.request({ method: "eth_chainId" });
      console.log(chainId);
      metaMaskProvider.on("chainChanged", (_chainId) => {
        window.location.reload();
      });
      metaMaskProvider.on("disconnect", function () {
        // alert("disconnected");
        window.location.reload();
      });
      metaMaskProvider.on("accountsChanged", function (_accounts) {
        window.location.reload();
      });
      if (chainId !== process.env.CHAIN_ID) {
        $store.commit("utils/setChainMisMatch", true);
        Wallet.provider = metaMaskProvider;
        return false;
        // await switchNetwork();
      }

      web3 = new Web3(metaMaskProvider);

      /**
       * Verify the connect address is on AL
       */
      const res = await verifyWalletisOG(metaMaskProvider, accounts[0]);

      /**
       * save to state
       */
      $store.commit("utils/setUserAccount", {
        account: accounts[0],
        isWhiteListed: res,
      });

      if (res) {
        // Add errorr state
        return metaMaskProvider;
      } else {
        $store.commit("utils/setErrorMessage", {
          state: true,
          msg: `${$store.getters["utils/AccountFormated"]}, not on AfroList. Only approved addresses are allowed to mint`,
        });
        return false;
      }
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 * Verify Existing CoinBase connections
 * @param {Object} $store inject vuex store object
 * @param {Object} $router inject vue router object
 * @returns
 */
const isCoinBaseConnected = async ($store) => {
  try {
    const coinBaseProvider = CoinBaseProvider();
    if (!coinBaseProvider) {
      return false;
    }

    const accounts = await coinBaseProvider.request({ method: "eth_accounts" });
    // console.log(accounts);
    if (accounts.length !== 0) {
      const chainId = await coinBaseProvider.request({ method: "eth_chainId" });
      console.log(chainId);
      coinBaseProvider.on("chainChanged", (_chainId) => {
        window.location.reload();
      });
      coinBaseProvider.on("disconnect", function () {
        alert("disconnected");
        window.location.reload();
      });
      coinBaseProvider.on("accountsChanged", function (_accounts) {
        window.location.reload();
      });
      if (chainId !== process.env.CHAIN_ID) {
        $store.commit("utils/setChainMisMatch", true);
        Wallet.provider = coinBaseProvider;
        return false;
        // await switchNetwork();
      }

      web3 = new Web3(coinBaseProvider);

      /**
       * Verify the connect address is on AL
       */
      const res = await verifyWalletisOG(coinBaseProvider, accounts[0]);

      /**
       * save to state
       */
      $store.commit("utils/setUserAccount", {
        account: accounts[0],
        isWhiteListed: res,
      });

      if (res) {
        return coinBaseProvider;
      } else {
        $store.commit("utils/setErrorMessage", {
          state: true,
          msg: `${$store.getters["utils/AccountFormated"]}, not on AfroList. Only approved addresses are allowed to mint`,
        });
        return false;
      }
    }

    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

/**
 *  Verify existing WalletConnect Connectoin
 * @param {Object} $store inject vuex store object
 * @param {Object} $router inject vue router object
 * @returns
 */
const isWallectConnectConnected = async ($store) => {
  try {
    if (Wallet.provider === null) {
      Wallet.provider = new WalletConnectProvider({
        infuraId: "e8f8c34dc1dd47b2a00d6569d52b8ec7", // Required
        qrcodeModalOptions: {
          mobileLinks: [
            "metamask",
            "trust",
            "argent",
            "trust",
            "imtoken",
            "pillar",
          ],
        },
      });
      Wallet.provider.on("connect", () => {
        console.log("connect");
      });

      Wallet.provider.on("disconnect", (code, reason) => {
        console.log(code, reason);
        console.log(reason);
      });
    }

    const web3 = new Web3(Wallet.provider);

    //  Get Accounts
    // await Wallet.provider.enable();
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);
    console.log(accounts[0]);
    if (accounts.length !== 0) {
      // await Wallet.provider.enable();
      Wallet.provider.on("chainChanged", (chainId) => {
        window.location.reload();
      });
      // web3 = new Web3(Wallet.provider);
      const chain_id = await web3.eth.getChainId();
      if (process.env.CHAIN_ID !== `0x${chain_id}`) {
        $store.commit("utils/setChainMisMatch", true);
        return false;
      }
      const res = await verifyWalletisOG(Wallet.provider, accounts[0]);

      /**
       * Save to state
       */
      $store.commit("utils/setUserAccount", {
        account: accounts[0],
        isWhiteListed: res,
      });

      if (res) {
        return Wallet.provider;
      } else {
        $store.commit("utils/setErrorMessage", {
          state: true,
          msg: `${$store.getters["utils/AccountFormated"]}, not on AfroList. Only approved addresses are allowed to mint`,
        });
        return false;
      }
    }
  } catch (error) {
    console.log("Unexpected Error");
  }
};
const switchAccount = async () => {
  if (await isMetamaskConnected()) {
    const metaMaskProvider = MetaMaskProvider();

    await metaMaskProvider.request({
      method: "wallet_requestPermissions",
      params: [
        {
          eth_accounts: {},
        },
      ],
    });
    window.location.reload();
  }
};

/**
 * Switch Network eg. Mainnet
 */
const switchNetwork = async () => {
  const { provider } = Wallet;
  const chain = {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    rpcUrls: [
      "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    ] /* ... */,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH", // 2-6 characters long
      decimals: 18,
    },
    blockExplorerUrls: ["https://etherscan.io"],
  };
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: process.env.CHAIN_ID }],
    });
    window.location.reload();
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [chain],
        });
      } catch (addError) {
        console.log("Failed to add Network");
      }
    }
    console.log("Failed to switch to the network");
  }
};

/**
 *  Connect using CoinBase Provider
 * @param {Object} $store inject vuex store object
 * @param {Object} $router inject vue router object
 * @returns
 */
async function connectCoinbase($store, $router) {
  const coinBaseProvider = CoinBaseProvider();
  console.log(coinBaseProvider);
  if (coinBaseProvider) {
    const accounts = await coinBaseProvider.request({
      method: "eth_requestAccounts",
    });
    const chainId = await coinBaseProvider.request({ method: "eth_chainId" });
    console.log(chainId);
    if (chainId !== process.env.CHAIN_ID) {
      $store.commit("utils/setChainMisMatch", true);
      await switchNetwork(coinBaseProvider);
    }
    if (accounts.length !== 0) {
      coinBaseProvider.on("disconnect", function () {
        alert("disconnected");
        window.location.reload();
      });
      coinBaseProvider.on("accountsChanged", function (_accounts) {
        window.location.reload();
      });
      coinBaseProvider.on("chainChanged", (_chainId) => {
        window.location.reload();
      });
      web3 = new Web3(coinBaseProvider);
      const res = await verifyWalletisOG(coinBaseProvider, accounts[0]);
      // console.log(res)
      $store.commit("utils/setUserAccount", {
        account: accounts[0],
        isWhiteListed: res,
      });

      coinBaseProvider.on("disconnect", function () {
        console.log("disconnected");
      });
      if (res) {
        const balance = await checkBalanceOfAddress(
          Wallet.provider,
          accounts[0]
        );
        if (balance > 0) {
          $store.commit("utils/setAccountMinted", true);
          $router.push("/minted");
          return;
        }
        $router.push("/explore");
        return;
      } else {
        $store.commit("utils/setErrorMessage", {
          state: true,
          msg: `${$store.getters["utils/AccountFormated"]}, not on AfroList. Only approved addresses are allowed to mint`,
        });
      }
    }
  } else {
    alert("Coinbase is not available.");
  }
}

/**
 * Connect using Metamask Provider
 * @param {Object} $store inject vuex store object
 * @param {Object} $router inject vue router object
 * @returns
 */
async function connectMetaMask($store, $router) {
  const metaMaskProvider = MetaMaskProvider();
  if (metaMaskProvider) {
    const accounts = await metaMaskProvider.request({
      method: "eth_requestAccounts",
    });
    const chainId = await metaMaskProvider.request({ method: "eth_chainId" });
    console.log(chainId);
    if (chainId !== process.env.CHAIN_ID) {
      // $store.commit("utils/setChainMisMatch", true);;
      $store.commit("utils/setChainMisMatch", true);
      await switchNetwork(metaMaskProvider);
    }
    if (accounts.length !== 0) {
      metaMaskProvider.on("disconnect", function () {
        alert("disconnected");
        window.location.reload();
      });
      metaMaskProvider.on("accountsChanged", function (_accounts) {
        window.location.reload();
      });
      metaMaskProvider.on("chainChanged", (_chainId) => {
        window.location.reload();
      });
      web3 = new Web3(metaMaskProvider);
      const res = await verifyWalletisOG(metaMaskProvider, accounts[0]);
      // console.log(res)
      $store.commit("utils/setUserAccount", {
        account: accounts[0],
        isWhiteListed: res,
      });
      $store.commit("utils/setProvider", metaMaskProvider);
      metaMaskProvider.on("disconnect", function () {
        console.log("disconnected");
      });
      if (res) {
        const balance = await checkBalanceOfAddress(
          metaMaskProvider,
          accounts[0]
        );
        if (balance > 0) {
          $store.commit("utils/setAccountMinted", true);
          $router.push("/minted");
          return;
        }

        $router.push("/explore");
        return;
      } else {
        $store.commit("utils/setErrorMessage", {
          state: true,
          msg: `${$store.getters["utils/AccountFormated"]}, not on AfroList. Only approved addresses are allowed to mint`,
        });
      }
    }
  } else {
    alert("Metamask is not available.");
  }
}

/**
 *  Connect using WallectConnect Provider
 * @param {Object} $store inject vuex store object
 * @param {Object} $router inject vue router object
 * @returns
 */
async function WalletConnect($store, $router) {
  try {
    Wallet.provider = new WalletConnectProvider({
      infuraId: "e8f8c34dc1dd47b2a00d6569d52b8ec7", // Required
      qrcodeModalOptions: {
        mobileLinks: [
          "metamask",
          "trust",
          "argent",
          "trust",
          "imtoken",
          "pillar",
        ],
      },
    });
    Wallet.provider.on("connect", () => {
      console.log("connect");
    });

    Wallet.provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      console.log(reason);
      window.location.reload();
    });
    try {
      await Wallet.provider.enable();
    } catch (error) {
      console.log("Error");
    }

    Wallet.provider.on("chainChanged", (chainId) => {
      window.location.reload();
    });
    web3 = new Web3(Wallet.provider);
    const chain_id = await web3.eth.getChainId();
    if (process.env.CHAIN_ID !== `0x${chain_id}`) {
      $store.commit("utils/setChainMisMatch", true);
      return false;
    }
    //  Get Accounts
    const accounts = await web3.eth.getAccounts();
    console.log(chain_id);
    if (accounts.length !== 0) {
      console.log(accounts[0]);

      const res = await verifyWalletisOG(Wallet.provider, accounts[0]);
      console.log(res);
      $store.commit("utils/setUserAccount", {
        account: accounts[0],
        isWhiteListed: res,
      });

      if (res) {
        const balance = await checkBalanceOfAddress(
          Wallet.provider,
          accounts[0]
        );
        if (balance > 0) {
          $store.commit("utils/setAccountMinted", true);
          $router.push("/minted");
          return;
        }
        $router.push("/explore");
        return;
      } else {
        $store.commit("utils/setErrorMessage", {
          state: true,
          msg: `${$store.getters["utils/AccountFormated"]}, not on AfroList. Only approved addresses are allowed to mint`,
        });
      }
    }
  } catch (error) {
    console.log("Unexpected Error Occured. Reach out Team on Discord");
  }
}

export {
  checkConnectedProvider,
  switchNetwork,
  MetaMaskProvider,
  CoinBaseProvider,
  connectCoinbase,
  connectMetaMask,
  WalletConnect,
  WalletIsConnected,
};
