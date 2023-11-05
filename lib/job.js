import Bench from './bench.js';

export default class Job {
	#bench;
	#definition;

	constructor({ channels, definition }) {
		this.#bench = new Bench({ channels });
		this.#definition = definition;
	}
}
