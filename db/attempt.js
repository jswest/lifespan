import { shelf } from "./db.js";
import Scrape from './scrape.js';

const Attempt = shelf.model("Attempt", {
	tableName: "scrape_attempts",
	attempt() {
		return this.hasOne(Scrape);
	},
});

export default Attempt