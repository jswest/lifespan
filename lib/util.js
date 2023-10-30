import "dotenv/config";
import { spawn } from "child_process";
import { resolve } from "path";
import { fileURLToPath } from 'url'
import winston from "winston";

export const config = {
	channelNames: ["fs", "s3"],
	viewport: {
		height: 1000,
		width: 1600,
	},
	userAgent: "default", // "default", "none", or an arbitrary string.
	wait: 500,
};

export function slugify(text) {
	return text
		.split(" ")
		.map((part) => part.replace(/[^a-zA-Z0-9]/g, ""))
		.join("-");
}

export function getCommitHash({ logger } = {}) {
	let log = console.log;
	if (logger) {
		log = logger.info;
	}

	return new Promise((resolve, reject) => {
		const cwd = resolve(
			fileURLToPath(import.meta.url)
				.split("/")
				.slice(0, -2)
				.join("/"),
		);
		log(`Making the current working directory "${cwd}".`);

		const child = spawn("git", ["rev-parse", "--short", "HEAD"], {
			cwd,
		});

		let data = "";
		let errors = "";

		child.stdout.on("data", (data) => {
			data += data.toString();
		});

		child.stderr.on("data", (data) => {
			errors += data.toString();
		});

		child.on("close", (code) => {
			if (code === 0) {
				const hash = data.trim();
				log(`The git commit hash is "${hash}".`);
				resolve(hash);
			}
			reject(code);
		});
	});
}

export function getLogger({ name } = {}) {
	if (!name) {
		throw new Error('You must pass a "name" to getLogger().');
		return;
	}
	const transports = [
		new winston.transports.File({ filename: `./log/${name}-combined.log` }),
	];
	if (process.env.ENVIRONMENT !== "production") {
		transports.push(
			new winston.transports.Console({ format: winston.format.simple() }),
		);
	}
	return winston.createLogger({
		level: "info",
		format: winston.format.json(),
		transports,
	});
}
