import "dotenv/config";
import winston from "winston";

export const config = {
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
