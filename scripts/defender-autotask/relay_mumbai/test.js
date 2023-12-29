const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');
const ethers = require('ethers');

const abi = [
    {inputs:[],stateMutability:"nonpayable",type:"constructor"},{inputs:[{components:[{internalType:"address",name:"from",type:"address"},{internalType:"address",name:"to",type:"address"},{internalType:"uint256",name:"value",type:"uint256"},{internalType:"uint256",name:"gas",type:"uint256"},{internalType:"uint256",name:"nonce",type:"uint256"},{internalType:"bytes",name:"data",type:"bytes"}],internalType:"struct MintRallyForwarder.ForwardRequest",name:"req",type:"tuple"},{internalType:"bytes",name:"signature",type:"bytes"}],name:"execute",outputs:[{internalType:"bool",name:"",type:"bool"},{internalType:"bytes",name:"",type:"bytes"}],stateMutability:"payable",type:"function"},{inputs:[{internalType:"address",name:"from",type:"address"}],name:"getNonce",outputs:[{internalType:"uint256",name:"",type:"uint256"}],stateMutability:"view",type:"function"},{inputs:[{components:[{internalType:"address",name:"from",type:"address"},{internalType:"address",name:"to",type:"address"},{internalType:"uint256",name:"value",type:"uint256"},{internalType:"uint256",name:"gas",type:"uint256"},{internalType:"uint256",name:"nonce",type:"uint256"},{internalType:"bytes",name:"data",type:"bytes"}],internalType:"struct MintRallyForwarder.ForwardRequest",name:"req",type:"tuple"},{internalType:"bytes",name:"signature",type:"bytes"}],name:"verify",outputs:[{internalType:"bool",name:"",type:"bool"}],stateMutability:"view",type:"function"}
];

async function relay(forwarder, request, signature, whitelist) {
  // Decide if we want to relay this request based on a whitelist
  const accepts = !whitelist || whitelist.includes(request.to);
  if (!accepts) throw new Error(`Rejected request to ${request.to}`);

  // Validate request on the forwarder contract
  const valid = await forwarder.verify(request, signature);
  if (!valid) throw new Error(`Invalid request`);

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(request.gas) + 50000).toString();
  return await forwarder.execute(request, signature, { gasLimit });
}

async function handler(event) {
  try {
    if (!event.request || !event.request.body)
      throw new Error(`Missing payload`);
    const { request, signature } = event.request.body;

    // Initialize Relayer provider and signer, and forwarder contract
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const credentials = { ...event };
    const provider = new DefenderRelayProvider(credentials);
    const signer = new DefenderRelaySigner(credentials, provider, {
      speed: "fast",
    });
    const forwarder = new ethers.Contract(
      "0x55Cd62CC87a4C7f97D0CE9FF00F7a90E9aa12882",
      abi,
      signer
    );

    // Relay transaction!
    const tx = await relay(forwarder, request, signature);
    console.log(`Sent meta-tx: ${tx.hash}`);
    return { tx: tx};
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
    handler,
    relay,
}
