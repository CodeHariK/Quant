package config

// Database & Store Constants
const (
	DBPath             = "haunter_cache.db"
	ReportsBucket      = "ValuationReports"
	WatchlistBucket    = "Watchlist"
	WatchlistKey       = "user_watchlist"
	KiteBucket         = "KiteSession"
	KiteSessionKey     = "user_kite_session"
	KitePortfolioBucket = "KitePortfolio"
	KitePortfolioKey   = "user_kite_portfolio"
	TradebookBucket    = "TradebookRecords"
	PortfoliosBucket   = "Portfolios"
)

// Financial Quantitative Calculation Constants
const (
	AnnualRiskFreeRate = 0.07  // 7.0% RBI / Treasury risk-free benchmark rate
	TradingDaysPerYear = 252.0 // Annual trading days multiplier
)

// Server Configuration Constants
const (
	DefaultServerPort = ":8080"
	DefaultSymbol     = "GLD"
)

// Default Watchlist Tickers
var DefaultWatchlist = []string{
	"GLD",
	"USDINR=X",
	"CL=F",
	"^NSEMDCP50",
	"^GSPC",
	"SMH",
}
