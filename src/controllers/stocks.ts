import axios from 'axios';
import Stock, {StockDocument} from '../models/stock';
import User from '../models/user';
import logger from '../config/logger';

const ALPHA_VANTAGE_API = process.env.ALPHA_VANTAGE_API;

interface AlphaVantageResponse {
	'Time Series (Daily)': {
	  [key: string]: {
		'1. open': string;
		'2. high': string;
		'3. low': string;
		'4. close': string;
	  };
	};
  }

const getStocks = async (req: any, res: any) => {
    logger.info('Inside function getStocks controllers/stocks.ts /stocksInfo');
    try {
    const { symbol } = req.query;
    const  userId  = req.user.id;

        const user: any = await User.findById({_id: userId});

        //checks if user has previously searched for the stock
        if(user.searchedSymbols.includes(symbol)){
            logger.info(`Data for ${symbol} found in database`);
            logger.info(`Fetching data for ${symbol} for user ${userId}`);
            const stocks:StockDocument[] = await Stock.find({ symbol, user: userId });
            logger.info(`Successfully fetched stocks for ${userId}`);
            return res.status(200).json(stocks);
        }       
  
        logger.info(`Fetching data for ${symbol} from Alpha Vantage`);

        //getting data from alphavantage api
        const stocks: StockDocument[] = await fetchStockData(symbol);

        if(!stocks){
          logger.error(`Invalid symbol: ${symbol}`)
          res.status(400).json({error: `Invalid symbol: ${symbol}`})
        }

        //adding the searched symbol to the user search history
        user.searchedSymbols.push(symbol);
        await user.save();

        //saving the stock data in database
        const stocksWithUser = stocks.map((stock) => ({
            ...stock,
            user: userId,
        }));
        await Stock.insertMany(stocksWithUser);        
      
    logger.info("Stocks fetched from Alpha Vantage and Stored in DB")
      return res.status(200).json(stocks);
    } 
    catch (error) {
      logger.error(`Error in getStocks: ${error}`);
      res.status(500).json({ error: 'Error fetching stock data' });
    }
  };
  
  //-------------------Last Six Months---------------------
  const fetchStockData = async (symbol: any) => {
    const response = await axios.get<AlphaVantageResponse>(
      `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API}`
    );
    const today = new Date();
  const lastSixMonths = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000); 
  //There are 180 days in six months
  //24 hours in one day
  //60 minutes in one hour
  //60 seconds in one minute
  //1000 miliseconds in one second
  //Therefore subtracting this from the current date and time gives us the historical data

  //To be used to fetch data for last seven days
  //const lastSevenDays = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
    const stockData = response.data['Time Series (Daily)'];
    const stocks: StockDocument[] = [];


    for(const timeStamp in stockData){
    const timestamp = new Date(timeStamp);
    if(timestamp >= lastSixMonths){
        const data = stockData[timeStamp];
        const stockDataObject:any = {
            symbol:symbol,
            timestamp: timestamp,
            open: Number(data['1. open']),
            high: Number(data['2. high']),
            low: Number(data['3. low']),
            close: Number(data['4. close']),
        };
        
        stocks.push(stockDataObject);
    }
}   
  
    logger.info(`Fetched data for ${symbol}`);
    return stocks;
  };



//-------------------Last six months ( do not work )--------------------
// const fetchStockData = async (symbol: string) => {
//   const response = await axios.get<AlphaVantageResponse>(
//     `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY_EXTENDED&symbol=${symbol}&interval=60min&slice=year1month6&apikey=${ALPHA_VANTAGE_API}`
//   );

//   const stockData = response.data['TIME_SERIES_INTRADAY'];

//   const stocks: StockDocument[] = stockData.map((stock: any) => {
//     const stockDataObject: any = {
//       symbol: symbol,
//       timestamp: new Date(stock.time),
//       open: Number(stock.open),
//       high: Number(stock.high),
//       low: Number(stock.low),
//       close: Number(stock.close),
//     };

//     return stockDataObject;
//   });

//   logger.info(`Fetched data for ${symbol}`);

//   return stocks;
// }; 


  
  export{ getStocks };