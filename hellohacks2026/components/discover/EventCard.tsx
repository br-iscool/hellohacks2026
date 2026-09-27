"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { EventInfo } from "@/lib/data/events";
import { CategoryTag } from "./CategoryTag";

type EventCardProps = {
	event: EventInfo;
	compact?: boolean;
	onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function EventCard({ event, compact = false, onClick }: EventCardProps) {
	const cardRef = useRef<HTMLDivElement>(null);
	const [isVisible, setIsVisible] = useState(false);
	const eventDate = new Date(event.date).toISOString().slice(0, 10);
	const calendarHref = `/calendar?date=${eventDate}&event=${encodeURIComponent(event.title)}`;
	useEffect(() => {
		const card = cardRef.current;
		if (!card) return;
		if (!("IntersectionObserver" in window)) {
			setIsVisible(true);
			return;
		}
		const observer = new IntersectionObserver(([entry]) => {
			if (entry.isIntersecting) {
				setIsVisible(true);
				observer.disconnect();
			}
		}, { rootMargin: "300px 0px" });
		observer.observe(card);
		return () => observer.disconnect();
	}, []);

	if (!isVisible) return <div ref={cardRef} className={`event-card event-card-placeholder ${compact ? "event-card-compact" : ""}`} aria-hidden="true" />;

	return (
		<Link className={`event-card ${compact ? "event-card-compact" : ""}`} href={calendarHref} aria-label={`View ${event.title} on the calendar`} onClick={onClick}>
			<div
				className="event-image-wrap"
				role="img"
				aria-label={`Image for ${event.title}`}
				style={event.imageUrl ? { backgroundImage: `url(${JSON.stringify(event.imageUrl)})` } : undefined}
			>
				{!event.imageUrl && <Image
					src={`/event-photos/event-${event.image}.jpg`}
					alt=""
					fill
					className="event-image"
				/>}
			</div>
			<div className="event-card-body">
				<div className="event-card-meta">
					<div className="tag-list">
						{(event.tags.length > 0 ? event.tags : [event.category]).map((tag) => <CategoryTag key={tag} name={tag} />)}
						{event.price === "Free" && !event.tags.some((tag) => tag.toLowerCase() === "free") && <CategoryTag name="Free" />}
					</div>
				</div>
				<h3>{event.title}</h3>
				<time className="event-card-date">{event.date.toUpperCase()}</time>
				<span className="club-link">
					{event.club}
				</span>
				<p className="event-description">{event.description}</p>
				<div className="event-details">
					<span><i className="tiny-icon clock-icon" aria-hidden="true" /> {event.time}</span>
					<span><i className="tiny-icon pin-icon" aria-hidden="true" /> {event.place}</span>
					<span><i className="tiny-icon ticket-icon" aria-hidden="true" /> {event.price}</span>
				</div>
			</div>
		</Link>
	);
}
