const axios = require('axios');
const Web3 = require('web3');
async function actualRequest(url) {
  return axios.get(url);
}

async function makeRequest(url) {
  try {
      const result = await actualRequest(url);
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay to handle rate limit
      return result;
  } catch (error) {
      console.error(error);
      // If rate limit exceeded error, wait for one second and retry
      if (error.message.includes('rate limit')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return await makeRequest(url);
      }
      throw error;
  }
}

// Connect Metamask
async function loadWeb3() {
  if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
  } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
  } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
  }
}

// Retrieve user's last 10 transactions with Etherscan API
async function loadBlockchainData() {
  let web3 = window.web3;
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0];
  console.log('Account:', account);
  appendToOutput(`Account: ${account}`);

  // Fetch transaction history using Etherscan API
  const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${account}&startblock=0&endblock=99999999&sort=desc&apikey=RKJDZRX53CY54XNNQ2A4MW1PMTDU5TGCDG`;

  try {
    const response = await makeRequest(url);
    const allTransactions = response.data.result;

    // Take only the latest 10 user transactions
    const latestTransactions = allTransactions.slice(0, 10);

    // Create an array to store date and gasUsed for each transaction
    const transactions = latestTransactions.map(tx => ({
      date: new Date(tx.timeStamp * 1000),
      gasUsed: tx.gasUsed,
    }));

    return transactions;

    console.log(transactions);
    appendToOutput(`Transactions: ${JSON.stringify(transactions, null, 2)}`);
  } catch (error) {
    console.error(error);
    appendToOutput(`Error fetching transactions: ${error.message}`);
  }
}


// Call the file apiRequests with CCRI API to get electricity-consumption and emissions for different crypto and each user's transactions
const { fetchElectricityConsumption, fetchEmissions, fetchEmissionsMATIC, fetchEmissionsSOL } = require('./apiRequests');
async function processTransactions(transactions) {
  // Creating an array to store the results
  const results = [];
  let CO2_MATIC_Sum = 0; // to store sum of CO2 from MATIC
  let CO2_SOL_Sum = 0; // to store sum of CO2 from SOL

  // Looping over each transaction
  for (const transaction of transactions) {
    const date = transaction.date;
    const gasUsed = transaction.gasUsed;

    // Fetching electricity consumption and emissions for each transaction
    const electricityConsumption = await fetchElectricityConsumption(date, gasUsed); // Fetching electricity consumption for ETH
    const emissions = await fetchEmissions(date, gasUsed); // Fetching emissions for ETH
    const emissionsMATIC = await fetchEmissionsMATIC(date); // Fetching emissions for MATIC
    const emissionsSOL = await fetchEmissionsSOL(date); // Fetching emissions for SOL

    // Summing the outputValues for MATIC and SOL
    CO2_MATIC_Sum += emissionsMATIC.outputValue;
    CO2_SOL_Sum += emissionsSOL.outputValue;
    
    // Storing the results for each transaction
    results.push({
      date: date,
      electricityConsumption: electricityConsumption,
      emissions: emissions
    });
  }

  // Creating the footprint_ETH array.
  let footprint_ETH = [
    results.map(transaction => transaction.date), // dates
    results.map(transaction => transaction.electricityConsumption.outputValue), // electricity consumption values
    results.map(transaction => transaction.emissions.outputValue) // emissions values
  ];

  // Calculating the total emissions.
  let CO2_ETH = results.reduce((total, transaction) => {
    return total + transaction.emissions.outputValue;
  }, 0);

  // Storing the total emissions in a new array called totalEmissions.
  let totalEmissions = ['CO2_ETH', CO2_ETH, 'CO2_MATIC', CO2_MATIC_Sum, 'CO2_SOL', CO2_SOL_Sum];


  return {footprint_ETH, totalEmissions}; // returning the results

}

// Call the file apiRequests to get the daily emission of a single transaction with all the available currencies
const { fetchDailyEmissions } = require('./apiRequests');
async function todayEmissions() {
  try {
    const dailyEmissions = await fetchDailyEmissions();
    console.log(dailyEmissions);
  } catch (error) {
    console.error('Error fetching daily emissions:', error);
  }
}

//Ricontrollare questa sotto
function appendToOutput(data) {
  const outputDiv = document.getElementById('output');
  const para = document.createElement('p');
  para.textContent = JSON.stringify(data, null, 2); // nicely formatted JSON
  outputDiv.appendChild(para);
}


loadWeb3();
loadBlockchainData()
  .then(transactions => { 
    processTransactions(transactions)
      .then(({footprint_ETH, totalEmissions}) => {
        console.log(footprint_ETH);
        console.log(totalEmissions);
      });
});
todayEmissions();
