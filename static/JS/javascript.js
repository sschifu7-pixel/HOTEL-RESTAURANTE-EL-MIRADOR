// Web3 & NFC Terminal Connection JS
let wallet = {
    provider: null,
    signer: null,
    address: "",
    contract: null,
    isScanningNfc: false
};

// Mapa y marcadores de San Bernardino Lagunas
let map = null;
let markers = {};
let routePolylines = [];

// Coordenadas geográficas reales basadas en Google Maps
const coords = {
    stage1: [18.6010, -97.2750], // Hospedaje (Cabañas El Mirador)
    stage2: [18.6015, -97.2735], // Gastronomía (Cocina de Humo)
    stage3: [18.6030, -97.2725], // Lancha (Laguna Grande)
    stage4: [18.6045, -97.2710], // Senderismo (Sendero de Aves)
    stage5: [18.6025, -97.2680], // Experiencia Nocturna (Fogata)
    stage6: [18.6020, -97.2650]  // Cierre (Cumbre Otzelotzi)
};


// Smart Contract ABI pre-cargado para evitar la molestia de copiar y pegar
const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "address payable",
                "name": "_restaurant",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tourist",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "allergy",
                "type": "string"
            }
        ],
        "name": "EscrowCreated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "beneficiary",
                "type": "address"
            }
        ],
        "name": "MilestoneReleased",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "tourist",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Refunded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "allergy",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_groupSize",
                "type": "uint256"
            },
            {
                "internalType": "string",
                "name": "_allergy",
                "type": "string"
            }
        ],
        "name": "createEscrow",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "groupSize",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "milestoneReleased",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "milestoneId",
                "type": "uint256"
            }
        ],
        "name": "releaseMilestone",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "refundRemaining",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "restaurant",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalDeposit",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "tourist",
        "outputs": [
            {
                "internalType": "address payable",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
];
const CONTRACT_BYTECODE = '0x608060405234801561001057600080fd5b50604051611dc4380380611dc48339818101604052810190610032919061014b565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036100a1576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610098906101fb565b60405180910390fd5b80600160006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505061021b565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610118826100ed565b9050919050565b6101288161010d565b811461013357600080fd5b50565b6000815190506101458161011f565b92915050565b600060208284031215610161576101606100e8565b5b600061016f84828501610136565b91505092915050565b600082825260208201905092915050565b7f446972656363696f6e2064656c2072657374617572616e746520696e76616c6960008201527f6461000000000000000000000000000000000000000000000000000000000000602082015250565b60006101e5602283610178565b91506101f082610189565b604082019050919050565b60006020820190508181036000830152610214816101d8565b9050919050565b611b9a8061022a6000396000f3fe60806040526004361061008a5760003560e01c806366d374fd1161005957806366d374fd146102d45780639e1c0295146102ff578063c13c1aa514610316578063ed16805814610341578063f6153ccd1461036c57610222565b8063138fcf921461022757806324454d5314610243578063317debf51461028057806363b635ea146102a957610222565b3661022257600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff161461011e576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161011590610e32565b60405180910390fd5b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055503460028190555060016003819055506040518060400160405280600781526020017f4e696e67756e6100000000000000000000000000000000000000000000000000815250600490816101b191906110a2565b5060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f9e7e9785060803c3942acaab3bde83342d5ab6a4516ca123b0b4fc881058959a3460405161021891906111cf565b60405180910390a2005b600080fd5b610241600480360381019061023c9190611354565b610397565b005b34801561024f57600080fd5b5061026a600480360381019061026591906113b0565b61053b565b60405161027791906113f8565b60405180910390f35b34801561028c57600080fd5b506102a760048036038101906102a291906113b0565b61055b565b005b3480156102b557600080fd5b506102be6109cf565b6040516102cb9190611413565b60405180910390f35b3480156102e057600080fd5b506102e96109d5565b6040516102f69190611491565b60405180910390f35b34801561030b57600080fd5b50610314610a63565b005b34801561032257600080fd5b5061032b610d5f565b60405161033891906114f4565b60405180910390f35b34801561034d57600080fd5b50610356610d83565b60405161036391906114f4565b60405180910390f35b34801561037857600080fd5b50610381610da9565b60405161038e9190611413565b60405180910390f35b600034116103da576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103d19061155b565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614610469576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161046090610e32565b60405180910390fd5b336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550346002819055508160038190555080600490816104c691906110a2565b5060008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167f9e7e9785060803c3942acaab3bde83342d5ab6a4516ca123b0b4fc881058959a348360405161052f92919061157b565b60405180910390a25050565b60056020528060005260406000206000915054906101000a900460ff1681565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614806106025750600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16145b610641576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106389061161d565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16036106d0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106c7906116af565b60405180910390fd5b600181101580156106e2575060068111155b610721576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161071890611741565b60405180910390fd5b6005600082815260200190815260200160002060009054906101000a900460ff1615610782576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610779906117ad565b60405180910390fd5b60018111156107f8576005600060018361079c91906117fc565b815260200190815260200160002060009054906101000a900460ff166107f7576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107ee906118a2565b60405180910390fd5b5b60016005600083815260200190815260200160002060006101000a81548160ff02191690831515021790555060006006820361083657479050610848565b600660025461084591906118f1565b90505b4781111561088b576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161088290611994565b60405180910390fd5b6000600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16826040516108d3906119e5565b60006040518083038185875af1925050503d8060008114610910576040519150601f19603f3d011682016040523d82523d6000602084013e610915565b606091505b5050905080610959576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161095090611a46565b60405180910390fd5b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16837fefa981f9388f17167597c5fee4fc3d24b2b772263e1accbf61cfb2d219fc40f5846040516109c29190611413565b60405180910390a3505050565b60035481565b600480546109e290610ebb565b80601f0160208091040260200160405190810160405280929190818152602001828054610a0e90610ebb565b8015610a5b5780601f10610a3057610100808354040283529160200191610a5b565b820191906000526020600020905b815481529060010190602001808311610a3e57829003601f168201915b505050505081565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161480610b0a5750600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16145b610b49576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b409061161d565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff1660008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1603610bd8576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610bcf906116af565b60405180910390fd5b600047905060008111610c20576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c1790611ad8565b60405180910390fd5b60008060009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1682604051610c67906119e5565b60006040518083038185875af1925050503d8060008114610ca4576040519150601f19603f3d011682016040523d82523d6000602084013e610ca9565b606091505b5050905080610ced576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ce490611b44565b60405180910390fd5b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff167fd7dee2702d63ad89917b6a4da9981c90c4d24f8c2bdfd64c604ecae57d8d065183604051610d539190611413565b60405180910390a25050565b60008054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600160009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b60025481565b600082825260208201905092915050565b7f456c206669646569636f6d69736f207961206861207369646f20696e6963696160008201527f6c697a61646f0000000000000000000000000000000000000000000000000000602082015250565b6000610e1c602683610daf565b9150610e2782610dc0565b604082019050919050565b60006020820190508181036000830152610e4b81610e0f565b9050919050565b600081519050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b60006002820490506001821680610ed357607f821691505b602082108103610ee657610ee5610e8c565b5b50919050565b60008190508160005260206000209050919050565b60006020601f8301049050919050565b600082821b905092915050565b600060088302610f4e7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff82610f11565b610f588683610f11565b95508019841693508086168417925050509392505050565b6000819050919050565b6000819050919050565b6000610f9f610f9a610f9584610f70565b610f7a565b610f70565b9050919050565b6000819050919050565b610fb983610f84565b610fcd610fc582610fa6565b848454610f1e565b825550505050565b600090565b610fe2610fd5565b610fed818484610fb0565b505050565b5b8181101561101157611006600082610fda565b600181019050610ff3565b5050565b601f8211156110565761102781610eec565b61103084610f01565b8101602085101561103f578190505b61105361104b85610f01565b830182610ff2565b50505b505050565b600082821c905092915050565b60006110796000198460080261105b565b1980831691505092915050565b60006110928383611068565b9150826002028217905092915050565b6110ab82610e52565b67ffffffffffffffff8111156110c4576110c3610e5d565b5b6110ce8254610ebb565b6110d9828285611015565b600060209050601f83116001811461110c57600084156110fa578287015190505b6111048582611086565b86555061116c565b601f19841661111a86610eec565b60005b828110156111425784890151825560018201915060208501945060208101905061111d565b8683101561115f578489015161115b601f891682611068565b8355505b6001600288020188555050505b505050505050565b61117d81610f70565b82525050565b7f4e696e67756e6100000000000000000000000000000000000000000000000000600082015250565b60006111b9600783610daf565b91506111c482611183565b602082019050919050565b60006040820190506111e46000830184611174565b81810360208301526111f5816111ac565b905092915050565b6000604051905090565b600080fd5b600080fd5b61121a81610f70565b811461122557600080fd5b50565b60008135905061123781611211565b92915050565b600080fd5b600080fd5b6000601f19601f8301169050919050565b61126182611247565b810181811067ffffffffffffffff821117156112805761127f610e5d565b5b80604052505050565b60006112936111fd565b905061129f8282611258565b919050565b600067ffffffffffffffff8211156112bf576112be610e5d565b5b6112c882611247565b9050602081019050919050565b82818337600083830152505050565b60006112f76112f2846112a4565b611289565b90508281526020810184848401111561131357611312611242565b5b61131e8482856112d5565b509392505050565b600082601f83011261133b5761133a61123d565b5b813561134b8482602086016112e4565b91505092915050565b6000806040838503121561136b5761136a611207565b5b600061137985828601611228565b925050602083013567ffffffffffffffff81111561139a5761139961120c565b5b6113a685828601611326565b9150509250929050565b6000602082840312156113c6576113c5611207565b5b60006113d484828501611228565b91505092915050565b60008115159050919050565b6113f2816113dd565b82525050565b600060208201905061140d60008301846113e9565b92915050565b60006020820190506114286000830184611174565b92915050565b60005b8381101561144c578082015181840152602081019050611431565b60008484015250505050565b600061146382610e52565b61146d8185610daf565b935061147d81856020860161142e565b61148681611247565b840191505092915050565b600060208201905081810360008301526114ab8184611458565b905092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006114de826114b3565b9050919050565b6114ee816114d3565b82525050565b600060208201905061150960008301846114e5565b92915050565b7f4465626520656e7669617220666f6e646f7320656e2045544800000000000000600082015250565b6000611545601983610daf565b91506115508261150f565b602082019050919050565b6000602082019050818103600083015261157481611538565b9050919050565b60006040820190506115906000830185611174565b81810360208301526115a28184611458565b90509392505050565b7f536f6c6f20656c2074757269737461206f20656c2072657374617572616e746560008201527f2070756564656e20656a656375746172206573746120616363696f6e00000000602082015250565b6000611607603c83610daf565b9150611612826115ab565b604082019050919050565b60006020820190508181036000830152611636816115fa565b9050919050565b7f456c206669646569636f6d69736f206e6f206861207369646f20696e6963696160008201527f6c697a61646f0000000000000000000000000000000000000000000000000000602082015250565b6000611699602683610daf565b91506116a48261163d565b604082019050919050565b600060208201905081810360008301526116c88161168c565b9050919050565b7f4944206465206869746f20696e76616c69646f2028646562652073657220646560008201527f6c203120616c2036290000000000000000000000000000000000000000000000602082015250565b600061172b602983610daf565b9150611736826116cf565b604082019050919050565b6000602082019050818103600083015261175a8161171e565b9050919050565b7f45737465206869746f20796120667565206c6962657261646f00000000000000600082015250565b6000611797601983610daf565b91506117a282611761565b602082019050919050565b600060208201905081810360008301526117c68161178a565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061180782610f70565b915061181283610f70565b925082820390508181111561182a576118296117cd565b5b92915050565b7f456c206869746f20616e746572696f72206e6f206861207369646f206c69626560008201527f7261646f00000000000000000000000000000000000000000000000000000000602082015250565b600061188c602483610daf565b915061189782611830565b604082019050919050565b600060208201905081810360008301526118bb8161187f565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b60006118fc82610f70565b915061190783610f70565b925082611917576119166118c2565b5b828204905092915050565b7f53616c646f20696e737566696369656e746520656e20656c20636f6e7472617460008201527f6f00000000000000000000000000000000000000000000000000000000000000602082015250565b600061197e602183610daf565b915061198982611922565b604082019050919050565b600060208201905081810360008301526119ad81611971565b9050919050565b600081905092915050565b50565b60006119cf6000836119b4565b91506119da826119bf565b600082019050919050565b60006119f0826119c2565b9150819050919050565b7f5472616e7366657220746f2072657374617572616e74206661696c6564000000600082015250565b6000611a30601d83610daf565b9150611a3b826119fa565b602082019050919050565b60006020820190508181036000830152611a5f81611a23565b9050919050565b7f4e6f2068617920666f6e646f732072656d616e656e74657320656e20656c206360008201527f6f6e747261746f00000000000000000000000000000000000000000000000000602082015250565b6000611ac2602783610daf565b9150611acd82611a66565b604082019050919050565b60006020820190508181036000830152611af181611ab5565b9050919050565b7f526566756e6420746f20746f7572697374206661696c65640000000000000000600082015250565b6000611b2e601883610daf565b9150611b3982611af8565b602082019050919050565b60006020820190508181036000830152611b5d81611b21565b905091905056fea264697066735822122091554646550ecea3cac4b3e21b73963f06530af686d37f2c345ccb1b091d3b1464736f6c634300081c0033';
const RESTAURANT_WALLET = '0x6187Fed989ab5D852925504777CaD6D067513ff6';

document.addEventListener('DOMContentLoaded', () => {
    // DOM Bindings
    const btnConnect = document.getElementById('btn-connect');
    const btnLoad = document.getElementById('btn-load');
    const btnDeposit = document.getElementById('btn-deposit');
    const btnRefund = document.getElementById('btn-refund');
    const btnNfcScan = document.getElementById('btn-nfc-scan');

    const touristNameInput = document.getElementById('tourist-name');
    const nfcCardholderDisplay = document.getElementById('nfc-cardholder-display');

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.querySelector('.unified-nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Sync input name to NFC Cardholder Graphic in real time
    if (touristNameInput && nfcCardholderDisplay) {
        touristNameInput.addEventListener('input', () => {
            nfcCardholderDisplay.innerText = touristNameInput.value.toUpperCase() || "TURISTA";
        });
    }

    // Connect wallet event
    if (btnConnect) {
        btnConnect.addEventListener('click', connectWallet);
    }

    // Load Contract event
    if (btnLoad) {
        btnLoad.addEventListener('click', loadContract);
    }

    // Send Deposit event
    if (btnDeposit) {
        btnDeposit.addEventListener('click', depositToEscrow);
    }

    // WebNFC Real Scan event
    if (btnNfcScan) {
        btnNfcScan.addEventListener('click', startNfcScan);
    }
    
    // WebNFC Real Write event
    const btnNfcWrite = document.getElementById('btn-nfc-write');
    if (btnNfcWrite) {
        btnNfcWrite.addEventListener('click', writeNfcTag);
    }

    // Release checkpoints events (Manual)
    for (let i = 1; i <= 6; i++) {
        const mBtn = document.getElementById(`btn-milestone-${i}`);
        if (mBtn) {
            mBtn.addEventListener('click', () => releaseMilestone(i));
        }
    }

    // Simulation events (Tap)
    for (let i = 1; i <= 6; i++) {
        const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
        if (simBtn) {
            simBtn.addEventListener('click', () => simulateNfcTap(i));
        }
    }

    // Refund event
    if (btnRefund) {
        btnRefund.addEventListener('click', refundEscrow);
    }

    // Back to video button handler
    const btnBackVideo = document.getElementById('btn-back-video');
    if (btnBackVideo) {
        btnBackVideo.addEventListener('click', playVideoShowcase);
    }

    logToConsole("Terminal Web3 iniciada. Conecte MetaMask y digite el contrato para comenzar.", "info");
    checkNfcSupport();
    
    // Inicializar mapa de Leaflet de forma segura
    try {
        initLeafletMap();
    } catch(e) {
        console.error("Error al iniciar el mapa: ", e);
        logToConsole("Error al cargar el mapa interactivo.", "warning");
    }
});

// Logs messages into the terminal view
function logToConsole(message, type = "info") {
    const consoleLogs = document.getElementById('console-logs');
    if (!consoleLogs) return;

    const time = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = `console-line ${type}`;
    
    let prefix = "💡 ";
    if (type === "success") prefix = "✅ ";
    if (type === "danger") prefix = "❌ ";
    if (type === "warning") prefix = "⚠️ ";
    if (type === "nfc") prefix = "📡 ";

    line.innerText = `[${time}] ${prefix}${message}`;

    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
}

// Check NFC support on device
function checkNfcSupport() {
    if ('NDEFReader' in window) {
        logToConsole("Hardware NFC detectado en el navegador (Compatible con WebNFC nativo).", "success");
    } else {
        logToConsole("WebNFC nativo no disponible en esta plataforma. Utilice la 'Simulación de NFC Tap' en computadoras de escritorio.", "warning");
    }
}

// Inicializar mapa real con Leaflet
function initLeafletMap() {
    if (!document.getElementById('map')) return;

    // Centrar mapa en San Bernardino Lagunas
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false
    }).setView([18.6025, -97.2700], 15);

    // Cargar capa de mapa oscuro (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
    }).addTo(map);

    // Segmentos individuales entre etapas sucesivas
    const segments = [
        [coords.stage1, coords.stage2],
        [coords.stage2, coords.stage3],
        [coords.stage3, coords.stage4],
        [coords.stage4, coords.stage5],
        [coords.stage5, coords.stage6]
    ];

    routePolylines = segments.map(seg => {
        return L.polyline(seg, {
            color: 'rgba(255, 255, 255, 0.1)',
            weight: 4,
            dashArray: '6, 6'
        }).addTo(map);
    });

    // Pintar estado inicial bloqueado
    updateProgressMap([false, false, false, false, false, false], false);
}

// Retorna el elemento HTML para el marcador de Leaflet
function getMarkerIcon(state, labelText) {
    return L.divIcon({
        className: `custom-map-marker ${state}`,
        html: `
            <div class="marker-inner">${labelText}</div>
            <div class="marker-glow-ring"></div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
    });
}

// 1. Connect MetaMask Wallet
async function connectWallet() {
    if (typeof window.ethereum === 'undefined') {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            if (window.location.protocol === 'http:') {
                const manualUrl = "http://" + window.location.host + window.location.pathname;
                alert("Para conectarte en el celular durante el desarrollo local, copia este enlace y pégalo en el navegador integrado de MetaMask:\n\n" + manualUrl);
                logToConsole("Por favor, abre la URL manualmente en el navegador de MetaMask.", "warning");
                return;
            } else {
                logToConsole("Redirigiendo a la app de MetaMask...", "info");
                const dappUrl = window.location.host + window.location.pathname;
                window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
                return;
            }
        } else {
            alert("MetaMask no está instalado.");
            logToConsole("MetaMask no detectado. Instale la extensión de navegador.", "danger");
            return;
        }
    }

    try {
        logToConsole("Solicitando conexión a MetaMask...");
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        wallet.provider = new ethers.providers.Web3Provider(window.ethereum, "any");
        wallet.signer = wallet.provider.getSigner();
        wallet.address = accounts[0];

        // Cambiar a Soneium Minato
        const TARGET_CHAIN_ID = '0x79a'; // Soneium Minato (1946)
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        if (chainId !== TARGET_CHAIN_ID) {
            try {
                // Intentar cambiar si ya está agregada
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: TARGET_CHAIN_ID }],
                });
                logToConsole("Red cambiada a Soneium Minato.", "info");
            } catch (switchErr) {
                // Código 4902 = la red no existe en MetaMask, agregarla
                if (switchErr.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: TARGET_CHAIN_ID,
                                chainName: 'Soneium Minato',
                                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                                rpcUrls: ['https://rpc.minato.soneium.org'],
                                blockExplorerUrls: ['https://explorer-testnet.soneium.org']
                            }]
                        });
                        logToConsole("Soneium Minato agregada y activada en MetaMask.", "success");
                    } catch (addErr) {
                        logToConsole(`No se pudo agregar Linea Sepolia: ${addErr.message}`, "warning");
                    }
                } else {
                    logToConsole(`No se pudo cambiar de red: ${switchErr.message}`, "warning");
                }
            }
        } else {
            logToConsole("Red correcta: Soneium Minato.", "success");
        }

        // Update UI
        const shortenedWallet = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
        document.getElementById('nav-wallet-status').innerText = `Billetera: ${shortenedWallet}`;
        document.getElementById('nav-wallet-status').classList.add('success');
        
        // Update header button
        const connectBtn = document.getElementById('btn-connect');
        connectBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Conectado`;
        connectBtn.style.color = "#10B981";
        connectBtn.style.borderColor = "#10B981";
        
        // Show navigation wallet badge
        const badge = document.getElementById('wallet-badge');
        if (badge) {
            document.getElementById('display-wallet-nav').innerText = shortenedWallet;
            badge.style.display = 'inline-flex';
        }

        logToConsole(`Billetera conectada exitosamente: ${wallet.address}`, "success");

        // Listen for change events
        window.ethereum.on('accountsChanged', (newAccounts) => {
            if (newAccounts.length === 0) {
                window.location.reload();
            } else {
                wallet.address = newAccounts[0];
                const newShortened = `${wallet.address.substring(0, 6)}...${wallet.address.substring(38)}`;
                document.getElementById('nav-wallet-status').innerText = `Billetera: ${newShortened}`;
                if (badge) {
                    document.getElementById('display-wallet-nav').innerText = newShortened;
                }
                logToConsole(`Cuenta de MetaMask cambiada a: ${wallet.address}`, "warning");
            }
        });

    } catch (err) {
        logToConsole(`Error de conexión: ${err.message}`, "danger");
    }
}

// 2. Load deployed smart contract
async function loadContract() {
    if (!wallet.signer) {
        alert("Por favor, conecte primero MetaMask.");
        logToConsole("Carga de contrato cancelada: Requiere conectar billetera primero.", "warning");
        return;
    }

    const addr = document.getElementById('contract-address').value.trim();

    if (!ethers.utils.isAddress(addr)) {
        alert("Dirección de contrato no válida.");
        logToConsole("Error de validación: La dirección provista no es una dirección Ethereum válida.", "danger");
        return;
    }

    try {
        logToConsole(`Cargando contrato inteligente en dirección: ${addr}...`);
        
        wallet.contract = new ethers.Contract(addr, CONTRACT_ABI, wallet.signer);
        
        const shortenedContract = `${addr.substring(0, 6)}...${addr.substring(38)}`;
        document.getElementById('nav-contract-status').innerText = `Contrato: ${shortenedContract}`;
        document.getElementById('nav-contract-status').classList.add('success');
        
        logToConsole(`Smart Contract cargado correctamente en: ${addr}`, "success");

        // Enable action buttons
        for (let i = 1; i <= 6; i++) {
            const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
            const mBtn = document.getElementById(`btn-milestone-${i}`);
            if (simBtn) simBtn.disabled = false;
            if (mBtn) mBtn.disabled = false;
        }
        document.getElementById('btn-refund').disabled = false;

        // Try reading balance and state from contract
        await readContractState();
        
        // Listen to Events
        listenToContractEvents();

    } catch (err) {
        logToConsole(`Error al enlazar el contrato: ${err.message}`, "danger");
    }
}

// 3. Read contract ether balance and states
async function readContractState() {
    if (!wallet.provider || !wallet.contract) return;
    try {
        const bal = await wallet.provider.getBalance(wallet.contract.address);
        const ethBalance = ethers.utils.formatEther(bal);
        logToConsole(`[Blockchain Query] Balance del Smart Contract: ${ethBalance} ETH`, "info");
        
        // Actualizar estado visual de la tarjeta NFC basado en el saldo y depósitos
        const nfcStatusDisplay = document.getElementById('nfc-status-display');
        const nfcCardUi = document.getElementById('nfc-card-ui');
        
        const hasBalance = parseFloat(ethBalance) > 0;
        
        if (hasBalance) {
            if (nfcStatusDisplay) {
                nfcStatusDisplay.innerText = "Fideicomiso Activo";
                nfcStatusDisplay.style.color = "#34d399";
            }
            if (nfcCardUi) nfcCardUi.style.borderColor = "rgba(16, 185, 129, 0.4)";
        } else {
            if (nfcStatusDisplay) {
                nfcStatusDisplay.innerText = "No Depositada / Vacío";
                nfcStatusDisplay.style.color = "#fbbf24";
            }
            if (nfcCardUi) nfcCardUi.style.borderColor = "rgba(255,255,255,0.1)";
        }

        let milestones = [false, false, false, false, false, false];

        // Consultar hitos liberados en blockchain
        for (let i = 1; i <= 6; i++) {
            const isReleased = await wallet.contract.milestoneReleased(i);
            milestones[i-1] = isReleased;
            const mBtn = document.getElementById(`btn-milestone-${i}`);
            const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
            
            if (isReleased) {
                if (mBtn) {
                    mBtn.classList.add('active-released');
                    mBtn.innerText = `Hito ${i} (Liberado)`;
                }
                if (simBtn) {
                    simBtn.classList.add('active-released');
                    simBtn.disabled = true;
                }
            } else {
                if (mBtn) {
                    mBtn.classList.remove('active-released');
                    mBtn.innerText = `Hito ${i} (${i===6?'Resto':'16%'})`;
                }
                if (simBtn) {
                    simBtn.classList.remove('active-released');
                    simBtn.disabled = false;
                }
            }
        }
        
        // Actualizar mapa interactivo
        updateProgressMap(milestones, hasBalance);
        
    } catch (err) {
        logToConsole(`Error al consultar estado del contrato: ${err.message}`, "warning");
    }
}

// Función auxiliar para actualizar el mapa interactivo de progreso con marcadores reales de Leaflet
function updateProgressMap(milestones, hasBalance) {
    if (!map) return;

    // Remover marcadores antiguos si existen
    Object.keys(markers).forEach(key => {
        if (markers[key]) {
            map.removeLayer(markers[key]);
        }
    });

    const stageEmojis = ['🏡', '🍳', '🛶', '🥾', '🔥', '⛰️'];
    const stageTitles = [
        "1. Hospedaje (Alojamiento)",
        "2. Gastronomía (Degustación)",
        "3. Lancha (Paseo Laguna)",
        "4. Senderismo (Guiado Bosque)",
        "5. Fogata (Exp. Nocturna)",
        "6. Cierre (Cumbre Otzelotzi)"
    ];
    
    // Determinar el estado de cada uno de los 6 marcadores
    let markerStates = [];
    for (let i = 1; i <= 6; i++) {
        if (i === 1) {
            if (milestones[0]) markerStates.push('completed');
            else if (hasBalance) markerStates.push('active');
            else markerStates.push('locked');
        } else {
            if (milestones[i-1]) markerStates.push('completed');
            else if (milestones[i-2]) markerStates.push('active');
            else markerStates.push('locked');
        }
    }

    const coordKeys = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6'];
    for (let i = 0; i < 6; i++) {
        markers[coordKeys[i]] = L.marker(coords[coordKeys[i]], {
            icon: getMarkerIcon(markerStates[i], stageEmojis[i])
        }).addTo(map).bindTooltip(`<b>${stageTitles[i]}</b>`, {
            permanent: true,
            direction: 'top',
            className: 'map-tooltip'
        });
    }

    // Actualizar polilíneas (segmentos entre estaciones)
    for (let k = 0; k < 5; k++) {
        const isCompleted = milestones[k];
        const isActive = !isCompleted && (k === 0 ? hasBalance : milestones[k-1]);
        
        if (isCompleted) {
            routePolylines[k].setStyle({ color: '#10B981', dashArray: null, weight: 5 });
        } else if (isActive) {
            routePolylines[k].setStyle({ color: '#00f2fe', dashArray: '6, 6', weight: 4 });
        } else {
            routePolylines[k].setStyle({ color: 'rgba(255, 255, 255, 0.1)', dashArray: '6, 6', weight: 4 });
        }
    }
}

// 4. Send Deposit
async function depositToEscrow() {
    if (!wallet.signer) {
        alert("Por favor, conecte primero MetaMask.");
        logToConsole("Operación cancelada: Requiere conectar billetera primero.", "warning");
        return;
    }

    const name = document.getElementById('tourist-name').value.trim();
    const gSize = parseInt(document.getElementById('group-size').value) || 1;
    const allergy = document.getElementById('allergy-select').value;
    const amountVal = document.getElementById('deposit-amount').value;

    try {
        logToConsole("Desplegando nuevo contrato TouristEscrow (Paso 1 de 2)...", "warning");
        const factory = new ethers.ContractFactory(CONTRACT_ABI, CONTRACT_BYTECODE, wallet.signer);
        const contract = await factory.deploy(RESTAURANT_WALLET, {
            gasLimit: 3000000
        });
        
        logToConsole("Transacción de despliegue enviada. Esperando confirmación en la blockchain...", "info");
        // CORRECCIÓN: ethers v5 usa contract.deployed() para esperar el minado del despliegue
        await contract.deployed();
        
        wallet.contract = contract;
        const newAddress = contract.address;
        logToConsole(`¡Contrato desplegado con éxito en: ${newAddress}!`, "success");

        // CORRECCIÓN: Actualizar el campo de dirección y los indicadores de la UI
        const contractAddressField = document.getElementById('contract-address');
        if (contractAddressField) contractAddressField.value = newAddress;
        
        const shortenedContract = `${newAddress.substring(0, 6)}...${newAddress.substring(38)}`;
        const navContractStatus = document.getElementById('nav-contract-status');
        if (navContractStatus) {
            navContractStatus.innerText = `Contrato: ${shortenedContract}`;
            navContractStatus.classList.add('success');
        }

        // Habilitar botones de acción tras el deploy
        for (let i = 1; i <= 6; i++) {
            const simBtn = document.getElementById(`btn-sim-milestone-${i}`);
            const mBtn = document.getElementById(`btn-milestone-${i}`);
            if (simBtn) simBtn.disabled = false;
            if (mBtn) mBtn.disabled = false;
        }
        const btnRefund = document.getElementById('btn-refund');
        if (btnRefund) btnRefund.disabled = false;

        // Activar escucha de eventos del nuevo contrato
        listenToContractEvents();

        logToConsole(`Enviando depósito de reserva por ${amountVal} ETH al smart contract (Paso 2 de 2)...`, "warning");
        
        let tx = await wallet.contract.createEscrow(gSize, allergy, {
            value: ethers.utils.parseEther(amountVal),
            gasLimit: 500000
        });

        logToConsole(`Transacción enviada. Hash: ${tx.hash}`, "info");
        logToConsole("Esperando confirmación de la red Ethereum (Testnet)...");
        
        const receipt = await tx.wait();
        logToConsole(`Transacción confirmada en bloque #${receipt.blockNumber}!`, "success");
        
        // Registrar en la base de datos local
        logToConsole("Registrando progreso en base de datos local...");
        const res = await fetch('/api/tourists/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': 'hackathon-demo-2026'
            },
            body: JSON.stringify({
                name: name,
                contract_address: wallet.contract.address.toLowerCase(),
                group_size: gSize,
                allergy: allergy
            })
        });
        const dbResult = await res.json();
        if (dbResult.success) {
            logToConsole(`Turista registrado exitosamente en base de datos (ID: ${dbResult.id})`, "success");
        } else {
            logToConsole(`Error al registrar en DB local: ${dbResult.error}`, "danger");
        }

        if (allergy !== 'Ninguna') {
            document.getElementById('allergy-type').innerText = allergy.toUpperCase();
            document.getElementById('allergy-alert').style.display = 'flex';
            logToConsole(`Alerta de alergia registrada en cocina: ${allergy}`, "danger");
        } else {
            document.getElementById('allergy-alert').style.display = 'none';
        }
        
        await readContractState();

    } catch (err) {
        logToConsole(`Error en depósito de reserva: ${err.message}`, "danger");
    }
}

// 5. Release Milestone checkpoint
async function releaseMilestone(id) {
    if (!wallet.contract) return;

    try {
        logToConsole(`Enviando transacción 'releaseMilestone(${id})' desde la terminal...`);
        
        const tx = await wallet.contract.releaseMilestone(id);
        logToConsole(`Transacción enviada. Hash: ${tx.hash}`, "info");
        logToConsole(`Esperando confirmación de liberación del Hito ${id}...`);
        
        const receipt = await tx.wait();
        logToConsole(`Hito ${id} liberado exitosamente en bloque #${receipt.blockNumber}! Fondos transferidos.`, "success");
        
        // Sincronizar actualización con base de datos local
        logToConsole(`Actualizando etapa ${id} en base de datos local...`);
        const res = await fetch('/api/tourists/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': 'hackathon-demo-2026'
            },
            body: JSON.stringify({
                contract_address: wallet.contract.address.toLowerCase(),
                stage_id: id
            })
        });
        const dbResult = await res.json();
        if (dbResult.success) {
            logToConsole(`Base de datos sincronizada. Etapa actual: ${id} (${dbResult.status})`, "success");
        } else {
            logToConsole(`Fallo al sincronizar con base de datos: ${dbResult.error}`, "danger");
        }

        // Actualizar visualmente la tarjeta NFC
        const nfcStatusDisplay = document.getElementById('nfc-status-display');
        if (nfcStatusDisplay) {
            nfcStatusDisplay.innerText = `Hito ${id} Completado`;
            nfcStatusDisplay.style.color = "#00f2fe";
        }
        
        await readContractState();

    } catch (err) {
        logToConsole(`Error al liberar el hito ${id}: ${err.message}`, "danger");
    }
}

// 6. Refund remaining escrow (Admin override)
async function refundEscrow() {
    if (!wallet.contract) return;

    try {
        logToConsole("Solicitando reembolso completo al turista 'refundRemaining()'.");
        
        const tx = await wallet.contract.refundRemaining();
        logToConsole(`Transacción de reembolso enviada. Hash: ${tx.hash}`, "info");
        
        const receipt = await tx.wait();
        logToConsole(`Fideicomiso reembolsado exitosamente en bloque #${receipt.blockNumber}`, "success");
        
        // Sincronizar actualización con base de datos local
        logToConsole("Sincronizando estado de REEMBOLSO en base de datos local...");
        const res = await fetch('/api/tourists/update/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Token': 'hackathon-demo-2026'
            },
            body: JSON.stringify({
                contract_address: wallet.contract.address.toLowerCase(),
                status: 'refunded'
            })
        });
        const dbResult = await res.json();
        if (dbResult.success) {
            logToConsole("Base de datos sincronizada: Estado marcado como REEMBOLSADO.", "success");
        } else {
            logToConsole(`Fallo al sincronizar con base de datos: ${dbResult.error}`, "danger");
        }

        await readContractState();

    } catch (err) {
        logToConsole(`Error al reembolsar fondos: ${err.message}`, "danger");
    }
}

// 7. WebNFC Real Scan API (Mobile Android Support)
async function startNfcScan() {
    if (!('NDEFReader' in window)) {
        alert("WebNFC no es soportado en este navegador/dispositivo. Utilice la emulación de escritorio.");
        logToConsole("Hardware NFC no disponible. Escaneo cancelado.", "warning");
        return;
    }

    if (wallet.isScanningNfc) {
        logToConsole("El lector NFC ya se encuentra activo.", "warning");
        return;
    }

    try {
        logToConsole("Iniciando sensor WebNFC. Coloque la tarjeta cerca de la antena...", "info");
        const ndef = new NDEFReader();
        await ndef.scan();
        
        wallet.isScanningNfc = true;
        
        // Animate UI
        const scannerDot = document.getElementById('console-scanner-dot');
        const nfcCardUi = document.getElementById('nfc-card-ui');
        const btnNfcScanBtn = document.getElementById('btn-nfc-scan');
        
        if (scannerDot) scannerDot.classList.add('scanning-active');
        if (nfcCardUi) nfcCardUi.classList.add('scanning');
        if (btnNfcScanBtn) btnNfcScanBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Lector NFC Escaneando...`;
        
        ndef.addEventListener("readingerror", () => {
            logToConsole("Error de lectura NFC. Acerque de nuevo la tarjeta.", "danger");
        });

        ndef.addEventListener("reading", async ({ message, serialNumber }) => {
            logToConsole(`[NFC Físico] Tarjeta detectada con Serial: ${serialNumber}`, "nfc");
            
            // Decodificar mensaje
            const decoder = new TextDecoder();
            let actionType = "";
            
            for (const record of message.records) {
                if (record.recordType === "text") {
                    const text = decoder.decode(record.data);
                    logToConsole(`[NFC Físico] Registro leído: "${text}"`, "nfc");
                    actionType = text.trim().toLowerCase();
                }
            }

            // Flash visual en la tarjeta
            animateCardTap();

            // Lógica: Si el tag especifica un hito, lo liberamos.
            if (actionType.includes("milestone-1") || actionType.includes("hito-1")) {
                await releaseMilestone(1);
            } else if (actionType.includes("milestone-2") || actionType.includes("hito-2")) {
                await releaseMilestone(2);
            } else if (actionType.includes("milestone-3") || actionType.includes("hito-3")) {
                await releaseMilestone(3);
            } else if (actionType.includes("milestone-4") || actionType.includes("hito-4")) {
                await releaseMilestone(4);
            } else if (actionType.includes("milestone-5") || actionType.includes("hito-5")) {
                await releaseMilestone(5);
            } else if (actionType.includes("milestone-6") || actionType.includes("hito-6")) {
                await releaseMilestone(6);
            } else {
                // Auto-detectar siguiente hito pendiente
                logToConsole("Mensaje NFC genérico. Detectando automáticamente siguiente hito en blockchain...", "info");
                await triggerNextMilestone();
            }
        });

    } catch (err) {
        logToConsole(`Error al encender WebNFC: ${err.message}`, "danger");
        stopNfcScanUI();
    }
}

function stopNfcScanUI() {
    wallet.isScanningNfc = false;
    const scannerDot = document.getElementById('console-scanner-dot');
    const nfcCardUi = document.getElementById('nfc-card-ui');
    const btnNfcScanBtn = document.getElementById('btn-nfc-scan');

    if (scannerDot) scannerDot.classList.remove('scanning-active');
    if (nfcCardUi) nfcCardUi.classList.remove('scanning');
    if (btnNfcScanBtn) btnNfcScanBtn.innerHTML = `<i class="fa-solid fa-tower-broadcast"></i> Activar Lector WebNFC Real`;
}

// 8. Desktop Tap Simulation Handler
async function simulateNfcTap(milestoneId) {
    if (!wallet.contract) {
        alert("Por favor, conecte primero su billetera y asocie el contrato.");
        logToConsole("Simulación fallida: Contrato no cargado.", "warning");
        return;
    }

    logToConsole(`[NFC Simulado] Tarjeta acercada al sensor de la terminal. Acción: Hito ${milestoneId}`, "nfc");
    
    // Animate the Virtual Card Tap
    animateCardTap();

    // Trigger the transaction in MetaMask
    await releaseMilestone(milestoneId);
}

// Helper to trigger the next milestone in sequence
async function triggerNextMilestone() {
    if (!wallet.contract) return;
    try {
        let nextToRelease = 0;
        for (let i = 1; i <= 6; i++) {
            const isReleased = await wallet.contract.milestoneReleased(i);
            if (!isReleased) {
                nextToRelease = i;
                break;
            }
        }

        if (nextToRelease > 0) {
            await releaseMilestone(nextToRelease);
        } else {
            logToConsole("Todos los hitos ya han sido liberados en este contrato.", "warning");
        }
    } catch (err) {
        console.error(err);
    }
}

// Card Tap Animation Effect
function animateCardTap() {
    const cardUi = document.getElementById('nfc-card-ui');
    if (!cardUi) return;
    
    // Add rapid scale and glow
    cardUi.style.transform = "scale(1.05) translateY(-5px)";
    cardUi.style.boxShadow = "0 0 35px var(--primary)";
    
    setTimeout(() => {
        cardUi.style.transform = "";
        cardUi.style.boxShadow = "";
    }, 400);
}

// Event Listeners for Smart Contract Logs in Blockchain
function listenToContractEvents() {
    if (!wallet.contract) return;
    try {
        wallet.contract.removeAllListeners();
        
        wallet.contract.on("EscrowCreated", (tourist, amount, allergy) => {
            const formattedEth = ethers.utils.formatEther(amount);
            logToConsole(`[EVENTO DE RED] Fideicomiso Creado por ${tourist}. Monto: ${formattedEth} ETH. Alergias: ${allergy}`, "success");
            readContractState();
        });

        wallet.contract.on("MilestoneReleased", (milestoneId, amount, beneficiary) => {
            const formattedEth = ethers.utils.formatEther(amount);
            logToConsole(`[EVENTO DE RED] Hito ${milestoneId} Confirmado. Fondos pagados: ${formattedEth} ETH a ${beneficiary}`, "success");
            readContractState();
        });
        
        wallet.contract.on("Refunded", (tourist, amount) => {
            const formattedEth = ethers.utils.formatEther(amount);
            logToConsole(`[EVENTO DE RED] Fondos devueltos al turista ${tourist}. Devuelto: ${formattedEth} ETH`, "warning");
            readContractState();
        });
        
        logToConsole("Sincronización de eventos blockchain en vivo activa.", "success");
    } catch (err) {
        console.error("Error al suscribirse a eventos: ", err);
    }
}

// INTERACTIVE GALLERY SHOWCASE CONTROLS
window.swapShowcase = function(imgSrc, title, desc) {
    const video = document.getElementById('gallery-video');
    const imgShowcase = document.getElementById('gallery-img-showcase');
    const sTitle = document.getElementById('showcase-title');
    const sDesc = document.getElementById('showcase-desc');
    const btnBackVideo = document.getElementById('btn-back-video');
    
    if (video) video.style.display = 'none';
    if (imgShowcase) {
        imgShowcase.src = imgSrc;
        imgShowcase.style.display = 'block';
    }
    
    if (sTitle) sTitle.innerText = title;
    if (sDesc) sDesc.innerText = desc;
    if (btnBackVideo) btnBackVideo.style.display = 'block';
}

window.playVideoShowcase = function() {
    const video = document.getElementById('gallery-video');
    const imgShowcase = document.getElementById('gallery-img-showcase');
    const sTitle = document.getElementById('showcase-title');
    const sDesc = document.getElementById('showcase-desc');
    const btnBackVideo = document.getElementById('btn-back-video');
    
    if (imgShowcase) imgShowcase.style.display = 'none';
    if (video) {
        video.style.display = 'block';
        video.play().catch(() => {});
    }
    
    if (sTitle) sTitle.innerText = "Degustación de Antojitos Regionales";
    if (sDesc) sDesc.innerText = "Experiencia gastronómica auténtica en Restaurante Campestre El Mirador con Escrow Web3 y NFC.";
    if (btnBackVideo) btnBackVideo.style.display = 'none';
}

window.swapShowcaseFromElement = function(element) {
    if (!element) return;
    const src = element.getAttribute('data-src');
    const title = element.getAttribute('data-title');
    const desc = element.getAttribute('data-desc');
    swapShowcase(src, title, desc);
}

// =========================================================
// FLASHCARDS (Turismo Tarjetas) LOGIC
// =========================================================
const flashcardsData = [
    { q: "¿Qué significado tiene el nombre del cerro 'Otzelotzi' donde hacemos nuestra cumbre?", a: "Significa 'Cerro del Ocelote' o 'Cerro del Tigre' en náhuatl." },
    { q: "¿Cuál es el secreto de nuestras quesadillas y empanadas hechas a mano?", a: "Se elaboran con masa de maíz criollo, cultivado y nixtamalizado en nuestra propia comunidad." },
    { q: "¿Qué cuerpo de agua exploramos durante el paseo en lancha?", a: "La Laguna Grande de San Bernardino Lagunas, un paraíso natural rodeado de montañas." },
    { q: "¿Por qué nuestra gastronomía se basa en la 'Cocina de Humo'?", a: "Porque cocinamos a la leña a fuego abierto, una técnica ancestral que da un sabor inigualable a cada platillo." },
    { q: "¿Qué majestuoso paisaje se puede observar desde nuestro mirador principal?", a: "Una vista panorámica impresionante de la laguna y, en días despejados, el volcán Pico de Orizaba." }
];

let currentCardIndex = 0;
let wrongCount = 0;
let rightCount = 0;
let isFlipped = false;

document.addEventListener('DOMContentLoaded', () => {
    initFlashcards();
});

function initFlashcards() {
    const container = document.getElementById('fc-container');
    const btnPrev = document.getElementById('fc-prev');
    const btnNext = document.getElementById('fc-next');
    const btnWrong = document.getElementById('fc-wrong');
    const btnRight = document.getElementById('fc-right');
    
    if (!container) return;

    renderCard();

    // Event listeners
    container.addEventListener('click', () => {
        isFlipped = !isFlipped;
        const cardElement = container.querySelector('.flashcard');
        if (cardElement) {
            cardElement.classList.toggle('flipped', isFlipped);
        }
    });

    // Keyboard navigation
    container.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            isFlipped = !isFlipped;
            const cardElement = container.querySelector('.flashcard');
            if (cardElement) {
                cardElement.classList.toggle('flipped', isFlipped);
            }
        } else if (e.code === 'ArrowLeft') {
            navigateCard(-1);
        } else if (e.code === 'ArrowRight') {
            navigateCard(1);
        }
    });

    if (btnPrev) btnPrev.addEventListener('click', () => navigateCard(-1));
    if (btnNext) btnNext.addEventListener('click', () => navigateCard(1));

    if (btnWrong) {
        btnWrong.addEventListener('click', () => {
            wrongCount++;
            document.getElementById('fc-count-wrong').innerText = wrongCount;
            navigateCard(1);
        });
    }

    if (btnRight) {
        btnRight.addEventListener('click', () => {
            rightCount++;
            document.getElementById('fc-count-right').innerText = rightCount;
            navigateCard(1);
        });
    }
}

function renderCard() {
    const container = document.getElementById('fc-container');
    if (!container || flashcardsData.length === 0) return;

    const data = flashcardsData[currentCardIndex];
    
    container.innerHTML = `
        <div class="flashcard active ${isFlipped ? 'flipped' : ''}">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-header">
                        <span>Dato ${currentCardIndex + 1} de ${flashcardsData.length}</span>
                        <i class="fa-solid fa-circle-question"></i>
                    </div>
                    <div class="flashcard-body">
                        <h3>${data.q}</h3>
                    </div>
                    <div class="flashcard-footer">
                        <i class="fa-solid fa-hand-pointer"></i> Clic o Espacio para voltear
                    </div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-header">
                        <span>Curiosidad</span>
                        <i class="fa-solid fa-lightbulb"></i>
                    </div>
                    <div class="flashcard-body">
                        <p>${data.a}</p>
                    </div>
                    <div class="flashcard-footer">
                        <i class="fa-solid fa-hand-pointer"></i> Clic o Espacio para regresar
                    </div>
                </div>
            </div>
        </div>
    `;
}

function navigateCard(direction) {
    currentCardIndex += direction;
    if (currentCardIndex < 0) currentCardIndex = flashcardsData.length - 1;
    if (currentCardIndex >= flashcardsData.length) currentCardIndex = 0;
    isFlipped = false;
    renderCard();
}

// 9. Write NFC Tag (Admin)
async function writeNfcTag() {
    const valueToWrite = document.getElementById('nfc-write-select').value;
    const btn = document.getElementById('btn-nfc-write');
    
    if (!('NDEFReader' in window)) {
        alert("WebNFC no está soportado en este dispositivo/navegador. Usa Chrome en Android.");
        logToConsole("Intento de escritura NFC fallido: No soportado.", "warning");
        return;
    }

    try {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Acerque la tarjeta...`;
        const ndef = new NDEFReader();
        await ndef.write(valueToWrite);
        
        logToConsole(`[NFC Físico] ¡Etiqueta grabada con éxito! Contenido: "${valueToWrite}"`, "success");
        alert("Etiqueta NFC grabada exitosamente con: " + valueToWrite);
        
    } catch (err) {
        logToConsole(`Error al grabar WebNFC: ${err.message}`, "danger");
        alert("Error al grabar etiqueta: " + err.message);
    } finally {
        btn.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Grabar Tag`;
    }
}
