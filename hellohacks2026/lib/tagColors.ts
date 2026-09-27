const tagColorPalette = [
	["#c9e1ff", "#234978"], ["#f5cdbf", "#793c2d"], ["#ddcef7", "#503576"],
	["#c5e9d9", "#285b43"], ["#f3dda8", "#6b4d0d"], ["#c5e4eb", "#28545d"],
	["#edcddd", "#713653"], ["#dce3ad", "#505922"], ["#d8d4ce", "#4c4842"],
	["#cbd9f7", "#2f4a7a"], ["#f2cfad", "#714326"], ["#d2e8b9", "#45602b"],
] as const;

export function colorsForTag(name: string): readonly [string, string] {
	let hash = 0;
	for (const character of name.toLocaleLowerCase()) {
		hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
	}
	return tagColorPalette[hash % tagColorPalette.length];
}

export function averageTagColor(tags: string[]): string {
	if (tags.length === 0) return "#dce6ec";
	const channels = [0, 0, 0];
	for (const tag of tags) {
		const color = colorsForTag(tag)[0];
		for (let channel = 0; channel < channels.length; channel++) {
			channels[channel] += Number.parseInt(color.slice(1 + channel * 2, 3 + channel * 2), 16);
		}
	}
	return `#${channels.map((channel) => Math.round(channel / tags.length).toString(16).padStart(2, "0")).join("")}`;
}
