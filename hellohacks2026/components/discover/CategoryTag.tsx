const tagColors = [
	["#dcecff", "#294c77"], ["#f8dfd5", "#784435"], ["#e7def7", "#543d79"],
	["#d9eee6", "#315d4a"], ["#f6e8c9", "#705522"], ["#d9e9ec", "#315860"],
	["#f1dfe9", "#703e5d"], ["#e7e9ce", "#555a2c"], ["#e2e0dc", "#514d47"],
	["#dbe5fa", "#344d78"], ["#f3e0d0", "#704b2f"], ["#e2eeda", "#496235"],
];

function colorsForTag(name: string) {
	let hash = 0;
	for (const character of name.toLocaleLowerCase()) {
		hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
	}
	return tagColors[hash % tagColors.length];
}

export function CategoryTag({ name, count }: { name: string; count?: number }) {
	const [backgroundColor, color] = colorsForTag(name);
	return (
		<span className={`category-tag category-${name.toLowerCase()}`} style={{ backgroundColor, color }}>
			{name}
			{count !== undefined && <span className="category-tag-count">{count}</span>}
		</span>
	);
}
