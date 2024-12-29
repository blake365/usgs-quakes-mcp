import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
	CallToolRequestSchema,
	GetPromptRequestSchema,
	ListPromptsRequestSchema,
	ListToolsRequestSchema,
	TextContent,
	ListRootsRequestSchema,
	Resource,
	ListResourcesRequestSchema,
	ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

const server = new Server(
	{ name: "macrostrat", version: "1.0.0" },
	{
		capabilities: {
			tools: {},
			prompts: {},
			roots: {},
			resources: {},
		},
	},
);

const API_SCHEMAS: Record<string, any> = {};

server.setRequestHandler(ListResourcesRequestSchema, async () => {
	const resources: Resource[] = [];
	return { resources };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
	const schema = API_SCHEMAS[request.params.uri];
	if (!schema) throw new Error(`Unknown schema: ${request.params.uri}`);

	return {
		contents: [],
	};
});

const PROMPTS = {
	// find earthquakes
};

server.setRequestHandler(ListPromptsRequestSchema, async () => {
	return {};
});

// Add type for valid prompt names
type PromptName = keyof typeof PROMPTS;

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
	const prompt = PROMPTS[request.params.name as PromptName];
	if (!prompt) {
		throw new Error(`Prompt not found: ${request.params.name}`);
	}

	return {};
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: "find-earthquakes",
				description:
					"Query the USGS earthquake API to find earthquakes based on a variety of parameters",
				inputSchema: {
					type: "object",
					properties: {
						endTime: {
							type: "string",
							description:
								"Limit to events on or before the specified end time. NOTE: All times use ISO8601 Date/Time format. Unless a timezone is specified, UTC is assumed. Defaults to NOW.",
						},
						startTime: {
							type: "string",
							description:
								"Limit to events on or after the specified start time. NOTE: All times use ISO8601 Date/Time format. Unless a timezone is specified, UTC is assumed. Defaults to NOW - 30 days.",
						},
						minLatitude: {
							type: "number",
							description:
								"Limit to events with a latitude larger than the specified minimum. NOTE: min values must be less than max values. Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						maxLatitude: {
							type: "number",
							description:
								"Limit to events with a latitude smaller than the specified maximum. NOTE: min values must be less than max values. Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						minLongitude: {
							type: "number",
							description:
								"Limit to events with a longitude larger than the specified minimum. NOTE: rectangles may cross the date line by using a minlongitude < -180 or maxlongitude > 180. NOTE: min values must be less than max values. Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						maxLongitude: {
							type: "number",
							description:
								"Limit to events with a longitude smaller than the specified maximum. NOTE: rectangles may cross the date line by using a minlongitude < -180 or maxlongitude > 180. NOTE: min values must be less than max values. Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						latitude: {
							type: "number",
							description:
								"Specify the latitude to be used for a circle radius search. NOTE: Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						longitude: {
							type: "number",
							description:
								"Specify the longitude to be used for a circle radius search. NOTE: Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						maxradiuskm: {
							type: "number",
							description:
								"Limit to events within the specified maximum number of kilometers from the geographic point defined by the latitude and longitude parameters. NOTE: Requests that use both rectangle and circle will return the intersection, which may be empty, use with caution.",
						},
						limit: {
							type: "number",
							description:
								"Limit the number of events returned. NOTE: The service limits queries to 20000, and any that exceed this limit will generate a HTTP response code “400 Bad Request”.",
							default: 100,
						},
						maxdepth: {
							type: "number",
							description:
								"Limit to events with depth less than the specified maximum.",
						},
						maxmagnitude: {
							type: "number",
							description:
								"Limit to events with a magnitude smaller than the specified maximum.",
						},
						mindepth: {
							type: "number",
							description:
								"Limit to events with depth more than the specified minimum.",
						},
						minmagnitude: {
							type: "number",
							description:
								"Limit to events with a magnitude larger than the specified minimum.",
						},
						orderby: {
							type: "string",
							description:
								"Sort the results by the specified field. NOTE: The default is to sort by time, with the most recent events first.",
							enum: ["time", "time-asc", "magnitude", "magnitude-asc"],
						},
						// alertlevel: {
						// 	type: "string",
						// 	description:
						// 		"Limit to events with a specific PAGER alert level. ",
						// 	enum: ["green", "yellow", "orange", "red"],
						// },
					},
				},
			},
			{
				name: "find-earthquake-details",
				description: "Get details about an earthquake",
				inputSchema: {
					type: "object",
					properties: {
						eventid: {
							type: "string",
							description: "The earthquake eventid",
						},
					},
				},
			},
		],
	};
});

// Add interface for earthquake API parameters
interface EarthquakeParams {
	endTime?: string;
	startTime?: string;
	minLatitude?: number;
	maxLatitude?: number;
	minLongitude?: number;
	maxLongitude?: number;
	latitude?: number;
	longitude?: number;
	maxradiuskm?: number;
	limit?: number;
	maxdepth?: number;
	maxmagnitude?: number;
	mindepth?: number;
	minmagnitude?: number;
	orderby?: "time" | "time-asc" | "magnitude" | "magnitude-asc";
	// alertlevel?: "green" | "yellow" | "orange" | "red";
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	let data: any;

	if (request.params.name === "find-earthquakes") {
		const params = request.params.arguments as EarthquakeParams;

		// Create a record of params, converting camelCase to snake_case where needed
		const paramMap: Record<string, string | number | undefined> = {
			endtime: params.endTime,
			starttime: params.startTime,
			minlatitude: params.minLatitude,
			maxlatitude: params.maxLatitude,
			minlongitude: params.minLongitude,
			maxlongitude: params.maxLongitude,
			latitude: params.latitude,
			longitude: params.longitude,
			maxradiuskm: params.maxradiuskm,
			limit: params.limit,
			maxdepth: params.maxdepth,
			maxmagnitude: params.maxmagnitude,
			mindepth: params.mindepth,
			minmagnitude: params.minmagnitude,
			orderby: params.orderby,
			// alertlevel: params.alertlevel,
		};

		// Filter out undefined values and convert to URLSearchParams compatible format
		const searchParams = new URLSearchParams(
			Object.entries(paramMap)
				.filter(([_, value]) => value !== undefined)
				.map(([key, value]) => [key, value!.toString()]),
		);

		const response = await fetch(
			`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&${searchParams}`,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch earthquakes: ${response.statusText} when using params:${searchParams.toString()}`,
			);
		}
		data = await response.json();
		data = data.features;
	}

	if (request.params.name === "find-earthquake-details") {
		const { eventid } = request.params.arguments as { eventid: string };
		const response = await fetch(
			`https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&eventid=${eventid}`,
		);
		if (!response.ok) {
			throw new Error(
				`Failed to fetch earthquake details: ${response.statusText} for eventid: ${eventid}`,
			);
		}

		data = await response.json();
		data = data.properties;
	}

	return {
		content: [
			{ type: "text", text: JSON.stringify(data, null, 2) } as TextContent,
		],
	};
});

function validateCoordinates(lat: number, lng: number) {
	if (typeof lat !== "number" || typeof lng !== "number") {
		throw new Error("Coordinates must be numbers");
	}
	if (lat < -90 || lat > 90) {
		throw new Error("Latitude must be between -90 and 90 degrees");
	}
	if (lng < -180 || lng > 180) {
		throw new Error("Longitude must be between -180 and 180 degrees");
	}
}

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error("Error starting server:", err);
	process.exit(1);
});
