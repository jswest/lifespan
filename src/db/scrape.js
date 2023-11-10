import { shelf } from "./db.js";
import Asset from "./asset.js";
import Attempt from "./attempt.js";

const Scrape = shelf.model("Scrape", {
	tableName: "scrapes",
	assets() {
		return this.hasMany(Asset);
	},
	attempt() {
		return this.belongsTo(Attempt);
	},
});

export default Scrape;
