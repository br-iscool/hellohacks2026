import { colorsForTag } from "@/lib/tagColors";

export function CategoryTag({ name, count }: { name: string; count?: number }) {
	const [backgroundColor, color] = colorsForTag(name);
	return (
		<span className={`category-tag category-${name.toLowerCase()}`} style={{ backgroundColor, color }}>
			{name}
			{count !== undefined && <span className="category-tag-count">{count}</span>}
		</span>
	);
}
