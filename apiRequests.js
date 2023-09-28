// This file uses the CCRI API to get data about electrical consumption and the carbon emissions of a single transaction for available coins. 
// The input required are the transaction date + gas consumption / n° of transactions.

// Getting user's eletrical consumption on the ETH network, for ETH POS.
async function fetchElectricityConsumption(date, value) {
  const url = 'https://v2.api.carbon-ratings.com/currencies/eth2/electricity-consumption/gasConsumption/tx-based?key=FLrJL4YDjksJw1llurHBoc6P';
  const body = {
    entries: [{ date, value }],
    parameters: { inputUnit: "gas", outputUnit: "kwh", predict: false } // Adjust the inputUnit as per API requirement
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const output = data.entries.map(entry => ({
      date: entry.date,
      outputValue: entry.outputValue,
    }));

    return output;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


// Getting user's CO2 emissions on the ETH network, for ETH POS. 
async function fetchEmissions(date, value) {
  const url = 'https://v2.api.carbon-ratings.com/currencies/eth2/emissions/gasConsumption/tx-based?key=FLrJL4YDjksJw1llurHBoc6P';
  const body = {
    entries: [{ date, value }],
    parameters: { inputUnit: "", outputUnit: "kg", predict: false }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const output = data.entries.map(entry => ({
      date: entry.date,
      outputValue: entry.outputValue,
    }));

    return output;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


// Getting CO2 emissions for a single transaction in MATIC (Layer2)
async function fetchEmissionsMATIC(date) {
    const url = 'https://v2.api.carbon-ratings.com/currencies/matic/emissions/txCount/tx-based?key=FLrJL4YDjksJw1llurHBoc6P';
    const nTransaction = 1;
    const body = {
      entries: [{ date, nTransaction }],
      parameters: { inputUnit: "", outputUnit: "kg", predict: false }
    };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const output = data.entries.map(entry => ({
      date: entry.date,
      outputValue: entry.outputValue,
    }));

    return output;
  } catch (error) {
    console.error(error);
    throw error;
  }
}


// Getting CO2 emissions for a single transaction in SOL (Solana Blockchain)
async function fetchEmissionsSOL(date) {
  const url = 'https://v2.api.carbon-ratings.com/currencies/sol/emissions/txCount/tx-based?key=FLrJL4YDjksJw1llurHBoc6P';
  const nTransaction = 1;
  const body = {
    entries: [{ date, nTransaction }],
    parameters: { inputUnit: "", outputUnit: "kg", predict: false }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const output = data.entries.map(entry => ({
      date: entry.date,
      outputValue: entry.outputValue,
    }));

    return output;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

 module.exports = { fetchElectricityConsumption, fetchEmissions, fetchEmissionsMATIC, fetchEmissionsSOL };


// Collect the daily emission of a single transaction with all the available currencies
async function fetchDailyEmissions() {
  // Initial tickers and URL
  const tickers = [
    "eth2", "matic", "sol", "algo", "dash", "bnb", "doge", "bsv", 
    "ada", "xtz", "atom", "bch", "btc", "ltc", "trx", "dot", "avax"
  ];
  const baseURL = 'https://v2.api.carbon-ratings.com/currencies';

  // Date calculation for 'yesterday'
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().split('T')[0]; // format as YYYY-MM-DD
  
  // Store the daily emissions
  const dailyEmissions = {};

  // Function to fetch emissions for a given URL and ticker
  async function fetchEmissionsForTicker(url, ticker) {
    const completeURL = `${url}/${ticker}/emissions/txCount/tx-based?key=FLrJL4YDjksJw1llurHBoc6P`;
    const response = await fetch(completeURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: [{ date, value: 1 }],
        parameters: { inputUnit: "", outputUnit: "kg", predict: false }
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.entries[0].outputValue;
  }

  // Fetch emissions for each ticker
  for (const ticker of tickers) {
    const outputValue = await fetchEmissionsForTicker(baseURL, ticker);
    dailyEmissions[ticker] = outputValue;
  }

  // Second round with different tickers and URL
  const secondRoundTickers = ["usdc", "busd", "shib", "dai", "link", "uni", "leo"];
  const secondBaseURL = baseURL.replace('currencies', 'tokens');
  
  for (const ticker of secondRoundTickers) {
    const outputValue = await fetchEmissionsForTicker(secondBaseURL, ticker);
    dailyEmissions[ticker] = outputValue;
  }

  return dailyEmissions;
}

module.exports.fetchDailyEmissions = fetchDailyEmissions;