import {shelf} from "./db.js";
import Scrape from './scrape.js';

const Asset = shelf.model("Asset", {
	tableName: "scrape_assets",
	scrape() {
		return this.belongsTo(Scrape);
	},
});

export default Asset;